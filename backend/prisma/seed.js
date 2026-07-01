require("dotenv/config");

const bcrypt = require("bcrypt");
const { PrismaClient, Role, UserStatus } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const defaultSettings = [
  { key: "crm_name", value: "CRM MVP" },
  { key: "default_currency", value: "EUR" },
  { key: "timezone", value: "Europe/Budapest" },
  { key: "date_format", value: "YYYY-MM-DD" },
];

const defaultPipelineStages = [
  { id: 1, name: "New", order: 1 },
  { id: 2, name: "Qualified", order: 2 },
  { id: 3, name: "Proposal", order: 3 },
  { id: 4, name: "Negotiation", order: 4 },
  { id: 5, name: "Won", order: 5 },
  { id: 6, name: "Lost", order: 6 },
];

async function seedDefaultTenant() {
  return prisma.tenant.upsert({
    where: { slug: "default" },
    create: {
      id: "tenant_default",
      name: "Default Tenant",
      slug: "default",
    },
    update: {
      name: "Default Tenant",
    },
  });
}

async function seedAdminUser(tenantId) {
  const email = process.env.DEFAULT_ADMIN_EMAIL || "admin.crm.system@gmail.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      firstName: process.env.DEFAULT_ADMIN_FIRST_NAME || "Admin",
      lastName: process.env.DEFAULT_ADMIN_LAST_NAME || "User",
      email,
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId,
    },
    update: {
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId,
    },
  });

  return email;
}

async function seedSettings(tenantId) {
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: {
        tenantId_key: {
          tenantId,
          key: setting.key,
        },
      },
      create: {
        ...setting,
        tenantId,
      },
      update: {},
    });
  }
}

async function seedPipelineStages() {
  for (const stage of defaultPipelineStages) {
    await prisma.pipelineStage.upsert({
      where: { id: stage.id },
      create: stage,
      update: {
        name: stage.name,
        order: stage.order,
      },
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval('"PipelineStage_id_seq"', COALESCE((SELECT MAX("id") FROM "PipelineStage"), 1), true)`
  );
}

async function main() {
  const tenant = await seedDefaultTenant();
  const adminEmail = await seedAdminUser(tenant.id);
  await seedPipelineStages();
  await seedSettings(tenant.id);

  console.log("Seed completed safely.");
  console.log(`Default tenant ensured: ${tenant.slug}`);
  console.log(`Default admin ensured: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
