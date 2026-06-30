import { prisma } from "../lib/prisma";
import { RequestUser } from "../lib/access";

type SettingInput = {
  key: string;
  value: string;
};

function requireTenantId(user?: RequestUser) {
  if (!user?.tenantId) {
    throw new Error("Tenant is required");
  }

  return user.tenantId;
}

export async function getSettings(user?: RequestUser) {
  const tenantId = requireTenantId(user);

  return prisma.setting.findMany({
    where: { tenantId },
    orderBy: { key: "asc" },
  });
}

export async function upsertSetting(data: SettingInput, user?: RequestUser) {
  const tenantId = requireTenantId(user);

  return prisma.setting.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: data.key,
      },
    },
    create: {
      ...data,
      tenantId,
    },
    update: { value: data.value },
  });
}

export async function deleteSetting(id: string, user?: RequestUser) {
  const tenantId = requireTenantId(user);

  return prisma.setting.deleteMany({
    where: { id, tenantId },
  });
}
