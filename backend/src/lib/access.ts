import { Role } from "@prisma/client";

export type RequestUser = {
  id: string;
  email: string;
  role: Role;
  tenantId?: string | null;
};

export function canViewAll(user?: RequestUser) {
  return user?.role === Role.ADMIN || user?.role === Role.MANAGER;
}

export function currentUserId(user?: RequestUser) {
  return user?.id;
}

export function tenantFilter<T extends object>(user?: RequestUser) {
  return {
    tenantId: user?.tenantId
      ? user.tenantId
      : { equals: "__tenant_required__" },
  } as T;
}

export function requireTenantId(user?: RequestUser) {
  if (!user?.tenantId) {
    throw new Error("Tenant is required");
  }

  return user.tenantId;
}
