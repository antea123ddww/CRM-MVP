import { DealStage, LeadStatusEnum, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";

export async function getReports(user?: RequestUser) {
  const leadWhere = tenantFilter<Prisma.LeadWhereInput>(user);
  const dealWhere = tenantFilter<Prisma.DealWhereInput>(user);
  const activityWhere = tenantFilter<Prisma.ActivityWhereInput>(user);
  const userWhere = tenantFilter<Prisma.UserWhereInput>(user);
  const [
    totalLeads,
    convertedLeads,
    lostLeads,
    totalDeals,
    wonDeals,
    lostDeals,
    revenue,
    activities,
    users,
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),

    prisma.lead.count({
      where: { ...leadWhere, status: LeadStatusEnum.CONVERTED },
    }),

    prisma.lead.count({
      where: { ...leadWhere, status: LeadStatusEnum.LOST },
    }),

    prisma.deal.count({ where: dealWhere }),

    prisma.deal.count({
      where: { ...dealWhere, stage: DealStage.WON },
    }),

    prisma.deal.count({
      where: { ...dealWhere, stage: DealStage.LOST },
    }),

    prisma.deal.aggregate({
      where: { ...dealWhere, stage: DealStage.WON },
      _sum: { value: true },
    }),

    prisma.activity.count({ where: activityWhere }),

    prisma.user.count({ where: userWhere }),
  ]);

  return {
    leadConversionReport: {
      totalLeads,
      convertedLeads,
      lostLeads,
      conversionRate:
        totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100),
    },
    salesPerformanceReport: {
      totalDeals,
      wonDeals,
      lostDeals,
      winRate:
        totalDeals === 0 ? 0 : Math.round((wonDeals / totalDeals) * 100),
    },
    revenueReport: {
      revenue: revenue._sum.value || 0,
    },
    activityReport: {
      totalActivities: activities,
    },
    userProductivityReport: {
      totalUsers: users,
    },
  };
}
