import { DealStage, Prisma, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { canViewAll, RequestUser, tenantFilter } from "../lib/access";

type DealInput = {
  title: string;
  value: number;
  stage?: DealStage;
  closeDate?: string;
  companyId: string;
};

const dealStageIds: Record<DealStage, number> = {
  [DealStage.NEW]: 1,
  [DealStage.QUALIFIED]: 2,
  [DealStage.PROPOSAL]: 3,
  [DealStage.NEGOTIATION]: 4,
  [DealStage.WON]: 5,
  [DealStage.LOST]: 6,
};

export async function getDeals(search?: string, user?: RequestUser) {
  const filters: Prisma.DealWhereInput[] = [];

  if (search) {
    filters.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (user?.tenantId) {
    filters.push(tenantFilter<Prisma.DealWhereInput>(user));
  }

  if (!canViewAll(user) && user) {
    filters.push({
      company: {
        OR: [
          { ownerId: user.id },
          { leads: { some: { assignedToId: user.id } } },
          { tasks: { some: { assignedToId: user.id } } },
        ],
      },
    });
  }

  return prisma.deal.findMany({
    where: filters.length ? { AND: filters } : undefined,
    include: {
      company: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDealById(id: string, user?: RequestUser) {
  return prisma.deal.findFirst({
    where: {
      id,
      ...tenantFilter<Prisma.DealWhereInput>(user),
      ...(!canViewAll(user) && user
        ? {
            company: {
              OR: [
                { ownerId: user.id },
                { leads: { some: { assignedToId: user.id } } },
                { tasks: { some: { assignedToId: user.id } } },
              ],
            },
          }
        : {}),
    },
    include: {
      company: true,
    },
  });
}

export async function createDeal(data: DealInput, user?: RequestUser) {
  const stage = data.stage || DealStage.NEW;
  const createData: Prisma.DealUncheckedCreateInput = {
    ...data,
    stage,
    stageId: dealStageIds[stage],
    closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
    tenantId: user?.tenantId || undefined,
  };

  return prisma.deal.create({
    data: createData,
    include: {
      company: true,
    },
  });
}

export async function updateDeal(
  id: string,
  data: Partial<DealInput>,
  user?: RequestUser
) {
  const nextCloseDate =
    data.closeDate === undefined
      ? undefined
      : data.closeDate
        ? new Date(data.closeDate)
        : null;

  const nextData: Prisma.DealUncheckedUpdateInput =
    user?.role === Role.MANAGER
      ? {
          stage: data.stage,
          stageId: data.stage ? dealStageIds[data.stage] : undefined,
        }
      : {
          title: data.title,
          value: data.value,
          companyId: data.companyId,
          closeDate: nextCloseDate,
          stage: data.stage,
          stageId: data.stage ? dealStageIds[data.stage] : undefined,
        };

  return prisma.deal.update({
    where: { id },
    data: nextData,
    include: {
      company: true,
    },
  });
}

export async function deleteDeal(id: string) {
  return prisma.deal.delete({
    where: { id },
  });
}
