import { LeadStatusEnum, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

export async function getTeamPerformance(user?: RequestUser) {
  const users = await prisma.user.findMany({
    where: tenantFilter<Prisma.UserWhereInput>(user),
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      leads: {
        select: {
          id: true,
          status: true,
        },
      },
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
      companies: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      firstName: "asc",
    },
  });

  return users.map((member) => {
    const totalLeads = member.leads.length;
    const convertedLeads = member.leads.filter(
      (lead) => lead.status === LeadStatusEnum.CONVERTED
    ).length;
    const openTasks = member.tasks.filter(
      (task) =>
        task.status === TaskStatus.OPEN || task.status === TaskStatus.IN_PROGRESS
    ).length;
    const completedTasks = member.tasks.filter(
      (task) => task.status === TaskStatus.COMPLETED
    ).length;
    const totalTasks = member.tasks.length;
    const conversionRate =
      totalLeads === 0 ? 0 : Math.round((convertedLeads / totalLeads) * 100);
    const taskCompletionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      role: member.role,
      ownedCompanies: member.companies.length,
      totalLeads,
      convertedLeads,
      conversionRate,
      totalTasks,
      completedTasks,
      openTasks,
      taskCompletionRate,
      performanceScore: Math.round((conversionRate + taskCompletionRate) / 2),
    };
  });
}
