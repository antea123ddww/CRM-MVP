require("dotenv/config");
require("dotenv").config({ path: ".env.render.local" });

const fs = require("node:fs/promises");
const path = require("node:path");
const { Prisma, PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const sourceUrl = process.env.DATABASE_URL;
const targetUrl = process.env.RENDER_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  throw new Error(
    "DATABASE_URL and RENDER_DATABASE_URL must both be configured."
  );
}

const source = new PrismaClient({
  adapter: new PrismaPg({ connectionString: sourceUrl }),
});
const target = new PrismaClient({
  adapter: new PrismaPg({ connectionString: targetUrl }),
});

const modelOrder = [
  "Tenant",
  "PipelineStage",
  "User",
  "Company",
  "Contact",
  "Lead",
  "Deal",
  "Task",
  "Activity",
  "Note",
  "Setting",
  "AuditLog",
];

const excludedFromImport = new Set([
  "PasswordResetToken",
  "RefreshToken",
]);

const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);

function delegateName(modelName) {
  return modelName[0].toLowerCase() + modelName.slice(1);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function reviveRows(modelName, rows) {
  const model = Prisma.dmmf.datamodel.models.find(
    (candidate) => candidate.name === modelName
  );
  const dateFields = new Set(
    model.fields
      .filter((field) => field.kind === "scalar" && field.type === "DateTime")
      .map((field) => field.name)
  );

  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        value !== null && dateFields.has(key) ? new Date(value) : value,
      ])
    )
  );
}

async function readAll(client) {
  const tables = {};

  for (const modelName of modelNames) {
    const delegate = client[delegateName(modelName)];
    tables[modelName] = await delegate.findMany();
  }

  return tables;
}

async function writeBackup(label, tables) {
  const backupDir = path.resolve(__dirname, "../backups");
  await fs.mkdir(backupDir, { recursive: true });
  const file = path.join(
    backupDir,
    `crm-${label}-before-render-import-${timestamp()}.json`
  );
  await fs.writeFile(
    file,
    JSON.stringify({ exportedAt: new Date().toISOString(), tables }, null, 2),
    "utf8"
  );
  return file;
}

function counts(tables) {
  return Object.fromEntries(
    Object.entries(tables).map(([name, rows]) => [name, rows.length])
  );
}

function remapForeignKeys(row, tenantMap, userMap) {
  const next = { ...row };

  if (next.tenantId && tenantMap.has(next.tenantId)) {
    next.tenantId = tenantMap.get(next.tenantId);
  }

  for (const key of ["ownerId", "assignedToId", "userId"]) {
    if (next[key] && userMap.has(next[key])) {
      next[key] = userMap.get(next[key]);
    }
  }

  return next;
}

async function importData(sourceTables) {
  return target.$transaction(
    async (tx) => {
      const tenantMap = new Map();
      const userMap = new Map();

      const targetTenants = await tx.tenant.findMany();
      const targetTenantBySlug = new Map(
        targetTenants.map((tenant) => [tenant.slug, tenant])
      );

      for (const tenant of reviveRows("Tenant", sourceTables.Tenant)) {
        const existing = targetTenantBySlug.get(tenant.slug);
        if (existing) {
          tenantMap.set(tenant.id, existing.id);
        } else {
          await tx.tenant.create({ data: tenant });
          tenantMap.set(tenant.id, tenant.id);
        }
      }

      await tx.pipelineStage.createMany({
        data: reviveRows("PipelineStage", sourceTables.PipelineStage),
        skipDuplicates: true,
      });

      const targetUsers = await tx.user.findMany();
      const targetUserByEmail = new Map(
        targetUsers.map((user) => [user.email.toLowerCase(), user])
      );

      for (const original of reviveRows("User", sourceTables.User)) {
        const user = remapForeignKeys(original, tenantMap, userMap);
        const existing = targetUserByEmail.get(user.email.toLowerCase());
        if (existing) {
          userMap.set(user.id, existing.id);
        } else {
          await tx.user.create({ data: user });
          userMap.set(user.id, user.id);
        }
      }

      for (const modelName of modelOrder.slice(3)) {
        if (excludedFromImport.has(modelName)) continue;

        const rows = reviveRows(modelName, sourceTables[modelName]).map((row) =>
          remapForeignKeys(row, tenantMap, userMap)
        );

        if (modelName === "Setting") {
          for (const setting of rows) {
            await tx.setting.upsert({
              where: {
                tenantId_key: {
                  tenantId: setting.tenantId,
                  key: setting.key,
                },
              },
              create: setting,
              update: { value: setting.value },
            });
          }
          continue;
        }

        if (rows.length) {
          await tx[delegateName(modelName)].createMany({
            data: rows,
            skipDuplicates: true,
          });
        }
      }
    },
    { timeout: 120000 }
  );
}

async function main() {
  const mode = process.argv[2] || "inspect";
  const sourceTables = await readAll(source);
  const targetTables = await readAll(target);

  console.log("Local counts:", counts(sourceTables));
  console.log("Render counts:", counts(targetTables));

  if (mode === "inspect") return;
  if (mode !== "import") throw new Error(`Unknown mode: ${mode}`);

  const localBackup = await writeBackup("local", sourceTables);
  const renderBackup = await writeBackup("render", targetTables);
  console.log("Local backup:", localBackup);
  console.log("Render backup:", renderBackup);

  await importData(sourceTables);

  const finalTargetTables = await readAll(target);
  console.log("Render counts after import:", counts(finalTargetTables));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  });
