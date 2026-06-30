import { LeadStatusEnum, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { canViewAll, RequestUser } from "../lib/access";

type LeadInput = {
  companyId: string;
  assignedToId?: string;
  source?: string;
  status?: LeadStatusEnum;
  estimatedValue?: number;
};

async function normalizeSource(source?: string | null) {
  return source?.trim() || null;
}

export async function getLeads(search?: string, user?: RequestUser) {
  const filters: Prisma.LeadWhereInput[] = [];

  if (search) {
    filters.push({
      OR: [
        { source: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (user?.tenantId) {
    filters.push({ tenantId: user.tenantId });
  }

  if (!canViewAll(user) && user) {
    filters.push({
      OR: [
        { assignedToId: user.id },
        { company: { ownerId: user.id } },
      ],
    });
  }

  const where: Prisma.LeadWhereInput | undefined =
    filters.length > 0 ? { AND: filters } : undefined;

  return prisma.lead.findMany({
    where,
    include: {
      company: true,
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      followUps: {
        orderBy: { dueDate: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getLeadById(id: string, user?: RequestUser) {
  const where: Prisma.LeadWhereInput = {
    id,
  };

  if (user?.tenantId) {
    where.tenantId = user.tenantId;
  }

  if (!canViewAll(user) && user) {
    where.OR = [
      { assignedToId: user.id },
      { company: { ownerId: user.id } },
    ];
  }

  return prisma.lead.findFirst({
    where,
    include: {
      company: true,
      assignedTo: true,
      followUps: {
        orderBy: { dueDate: "asc" },
      },
    },
  });
}

export async function createLead(data: LeadInput, user?: RequestUser) {
  const status = data.status || LeadStatusEnum.NEW;
  const source = (await normalizeSource(data.source)) || undefined;
  const createData: Prisma.LeadUncheckedCreateInput = {
    ...data,
    source,
    status,
    assignedToId: data.assignedToId || user?.id,
    tenantId: user?.tenantId || undefined,
  };

  return prisma.lead.create({
    data: createData,
    include: {
      company: true,
      assignedTo: true,
    },
  });
}

export async function updateLead(id: string, data: Partial<LeadInput>) {
  const source =
    data.source === undefined ? undefined : await normalizeSource(data.source);
  const updateData: Prisma.LeadUncheckedUpdateInput = {
    companyId: data.companyId,
    assignedToId: data.assignedToId,
    estimatedValue: data.estimatedValue,
    source,
    status: data.status,
  };

  return prisma.lead.update({
    where: { id },
    data: updateData,
    include: {
      company: true,
      assignedTo: true,
    },
  });
}

export async function deleteLead(id: string) {
  return prisma.lead.delete({
    where: { id },
  });
}
