import { prisma } from "../lib/prisma";
import { canViewAll, RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

type CompanyInput = {
  name: string;
  taxNumber?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  ownerId?: string;
};

export async function getCompanies(search?: string, user?: RequestUser) {
  const filters: Prisma.CompanyWhereInput[] = [];

  if (search) {
    filters.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { taxNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        {
          owner: {
            is: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  if (user?.tenantId) {
    filters.push(tenantFilter<Prisma.CompanyWhereInput>(user));
  }

  if (!canViewAll(user) && user) {
    filters.push({
      OR: [
        { ownerId: user.id },
        { leads: { some: { assignedToId: user.id } } },
        { tasks: { some: { assignedToId: user.id } } },
      ],
    });
  }

  return prisma.company.findMany({
    where: filters.length ? { AND: filters } : undefined,
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      contacts: true,
      leads: true,
      deals: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCompanyById(id: string, user?: RequestUser) {
  return prisma.company.findFirst({
    where: {
      id,
      ...tenantFilter<Prisma.CompanyWhereInput>(user),
      ...(!canViewAll(user) && user
        ? {
            OR: [
              { ownerId: user.id },
              { leads: { some: { assignedToId: user.id } } },
              { tasks: { some: { assignedToId: user.id } } },
            ],
          }
        : {}),
    },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      contacts: true,
      leads: true,
      deals: true,
      tasks: true,
      activities: true,
      notes: true,
    },
  });
}

export async function createCompany(data: CompanyInput, user?: RequestUser) {
  const { ownerId, ...companyData } = data;
  const nextOwnerId = ownerId || user?.id;

  return prisma.company.create({
    data: {
      ...companyData,
      owner: nextOwnerId ? { connect: { id: nextOwnerId } } : undefined,
      tenant: user?.tenantId ? { connect: { id: user.tenantId } } : undefined,
    },
  });
}

export async function updateCompany(id: string, data: Partial<CompanyInput>) {
  return prisma.company.update({
    where: { id },
    data,
  });
}

export async function deleteCompany(id: string) {
  return prisma.company.delete({
    where: { id },
  });
}
