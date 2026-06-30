import { Role } from "@prisma/client";

export const permissions = {
  dashboard: [Role.ADMIN, Role.MANAGER, Role.SALES],
  companies: [Role.ADMIN, Role.SALES],
  contacts: [Role.ADMIN],
  leads: [Role.ADMIN, Role.MANAGER, Role.SALES],
  deals: [Role.ADMIN, Role.MANAGER, Role.SALES],
  tasks: [Role.ADMIN, Role.SALES],
  activities: [Role.ADMIN],
  auditLogs: [Role.ADMIN],
  notes: [Role.ADMIN],
  reports: [Role.ADMIN],
  teamPerformance: [Role.MANAGER],
  users: [Role.ADMIN],
  settings: [Role.ADMIN],
} satisfies Record<string, Role[]>;
