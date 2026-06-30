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
  return user?.tenantId ? ({ tenantId: user.tenantId } as T) : {};
}
