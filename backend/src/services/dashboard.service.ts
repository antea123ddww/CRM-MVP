import { DealStage, LeadStatusEnum, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

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
    revenueForecast,
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

    prisma.deal.aggregate({
      where: {
        ...dealWhere,
        stage: {
          not: DealStage.LOST,
        },
      },
      _sum: {
        value: true,
      },
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

  const revenueByMonth = wonDealsForRevenue.reduce<Record<string, number>>(
    (acc, deal) => {
      const month = deal.closeDate!.toLocaleString("en-US", {
        month: "short",
      });

      acc[month] = (acc[month] || 0) + Number(deal.value);
      return acc;
    },
    {}
  );

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
    revenueForecast: Number(revenueForecast._sum.value || 0),

    salesFunnel: salesFunnel.map((item) => ({
      name: item.status,
      value: item._count._all,
    })),

    revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({
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
