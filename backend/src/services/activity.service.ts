import { ActivityType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

type ActivityInput = {
  type: ActivityType;
  title: string;
  content?: string;
  companyId: string;
  contactId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
};

export async function getActivities(user?: RequestUser) {
  return prisma.activity.findMany({
    where: tenantFilter<Prisma.ActivityWhereInput>(user),
    include: {
      company: true,
      contact: true,
      lead: {
        include: {
          company: true,
        },
      },
      deal: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createActivity(data: ActivityInput, user?: RequestUser) {
  return prisma.activity.create({
    data: {
      ...data,
      tenantId: user?.tenantId || undefined,
    },
  });
}

export async function updateActivity(id: string, data: Partial<ActivityInput>) {
  return prisma.activity.update({
    where: { id },
    data,
  });
}

export async function deleteActivity(id: string) {
  return prisma.activity.delete({ where: { id } });
}
