import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

export async function createAuditLog(data: {
  action: string;
  module: string;
  userId?: string;
  tenantId?: string | null;
  details?: string;
}) {
  return prisma.auditLog.create({
    data,
  });
}

export async function getAuditLogs(user?: RequestUser) {
  return prisma.auditLog.findMany({
    where: tenantFilter<Prisma.AuditLogWhereInput>(user),
    orderBy: {
      createdAt: "desc",
    },
  });
}
