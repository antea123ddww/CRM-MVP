import { prisma } from "../lib/prisma";
import { canViewAll, RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

type ContactInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  companyId: string;
};

export async function getContacts(search?: string, user?: RequestUser) {
  const filters: Prisma.ContactWhereInput[] = [];

  if (search) {
    filters.push({
      OR: [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (user?.tenantId) {
    filters.push(tenantFilter<Prisma.ContactWhereInput>(user));
  }

  if (!canViewAll(user) && user) {
    filters.push({ company: { ownerId: user.id } });
  }

  return prisma.contact.findMany({
    where: filters.length ? { AND: filters } : undefined,
    include: {
      company: true,
      notes: {
        orderBy: { createdAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getContactById(id: string, user?: RequestUser) {
  return prisma.contact.findFirst({
    where: {
      id,
      ...tenantFilter<Prisma.ContactWhereInput>(user),
      ...(!canViewAll(user) && user ? { company: { ownerId: user.id } } : {}),
    },
    include: {
      company: true,
      notes: {
        orderBy: { createdAt: "desc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createContact(data: ContactInput, user?: RequestUser) {
  return prisma.contact.create({
    data: {
      ...data,
      tenantId: user?.tenantId || undefined,
    },
  });
}

export async function updateContact(id: string, data: Partial<ContactInput>) {
  return prisma.contact.update({
    where: { id },
    data,
  });
}

export async function deleteContact(id: string) {
  return prisma.contact.delete({
    where: { id },
  });
}
