import { DealStage, LeadStatusEnum, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

const stageProbability: Record<DealStage, number> = {
  [DealStage.NEW]: 0.1,
  [DealStage.QUALIFIED]: 0.3,
  [DealStage.PROPOSAL]: 0.5,
  [DealStage.NEGOTIATION]: 0.75,
  [DealStage.WON]: 1,
  [DealStage.LOST]: 0,
};

export async function getDashboardStats(user?: RequestUser) {
  const leadWhere = tenantFilter<Prisma.LeadWhereInput>(user);
  const dealWhere = tenantFilter<Prisma.DealWhereInput>(user);
  const taskWhere = tenantFilter<Prisma.TaskWhereInput>(user);
  const userWhere = tenantFilter<Prisma.UserWhereInput>(user);

  const [
    totalLeads,
    activeDeals,
    wonDealsCount,
    lostDeals,
    tasksDueToday,
    dealsForForecast,
    salesFunnel,
    leadSources,
    wonDealsForRevenue,
    users,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),

    prisma.deal.count({
      where: {
        ...dealWhere,
        stage: {
          notIn: [DealStage.WON, DealStage.LOST],
        },
      },
    }),

    prisma.deal.count({
      where: { ...dealWhere, stage: DealStage.WON },
    }),

    prisma.deal.count({
      where: { ...dealWhere, stage: DealStage.LOST },
    }),

    prisma.task.count({
      where: {
        ...taskWhere,
        status: {
          not: TaskStatus.COMPLETED,
        },
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),

    prisma.deal.findMany({
      where: {
        ...dealWhere,
        stage: {
          not: DealStage.LOST,
        },
      },
      select: { value: true, stage: true },
    }),

    prisma.lead.groupBy({
      by: ["status"],
      where: leadWhere,
      _count: { _all: true },
    }),

    prisma.lead.groupBy({
      by: ["source"],
      where: { ...leadWhere, source: { not: null } },
      _count: { _all: true },
    }),

    prisma.deal.findMany({
      where: {
        ...dealWhere,
        stage: DealStage.WON,
        closeDate: { not: null },
      },
      select: { value: true, closeDate: true },
    }),

    prisma.user.findMany({
      where: userWhere,
      select: {
        firstName: true,
        lastName: true,
        leads: { select: { status: true } },
        tasks: { select: { status: true } },
      },
    }),
  ]);

  const revenueByMonth = wonDealsForRevenue.reduce<
    Record<string, { month: string; revenue: number; sortDate: number }>
  >((acc, deal) => {
    const closeDate = deal.closeDate!;
    const year = closeDate.getUTCFullYear();
    const monthIndex = closeDate.getUTCMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    if (!acc[key]) {
      acc[key] = {
        month: new Intl.DateTimeFormat("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(closeDate),
        revenue: 0,
        sortDate: Date.UTC(year, monthIndex, 1),
      };
    }

    acc[key].revenue += Number(deal.value);
    return acc;
  }, {});

  const revenueForecast = dealsForForecast.reduce((sum, deal) => {
    return sum + Number(deal.value) * stageProbability[deal.stage];
  }, 0);

  const teamPerformance = users.map((user) => {
    const completedTasks = user.tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED
    ).length;
    const convertedLeads = user.leads.filter(
      (lead) => lead.status === LeadStatusEnum.CONVERTED
    ).length;

    return {
      name: `${user.firstName} ${user.lastName}`,
      value: completedTasks + convertedLeads,
    };
  });

  return {
    totalLeads,
    activeDeals,
    wonDeals: wonDealsCount,
    lostDeals,
    tasksDueToday,
    revenueForecast,

    salesFunnel: salesFunnel.map((item) => ({
      name: item.status,
      value: item._count._all,
    })),

    revenueByMonth: Object.values(revenueByMonth)
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(({ month, revenue }) => ({
        month,
        revenue,
      })),

    leadSources: leadSources.map((item) => ({
      name: item.source || "Unknown",
      value: item._count._all,
    })),

    teamPerformance,
  };
}
