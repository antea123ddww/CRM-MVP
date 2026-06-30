import bcrypt from "bcrypt";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, tenantFilter } from "../lib/access";
import type { Prisma } from "@prisma/client";

type UserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  tenantId?: string;
};

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  status: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
};

export async function getUsers(user?: RequestUser) {
  return prisma.user.findMany({
    where: tenantFilter<Prisma.UserWhereInput>(user),
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAssignableUsers(user?: RequestUser) {
  return prisma.user.findMany({
    where: {
      ...tenantFilter<Prisma.UserWhereInput>(user),
      role: Role.SALES,
      status: UserStatus.ACTIVE,
    },
    select: userSelect,
    orderBy: { firstName: "asc" },
  });
}

export async function createUser(data: UserInput) {
  if (!data.password) {
    throw new Error("Password is required");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hashedPassword,
      role: data.role || Role.SALES,
      status: data.status || UserStatus.ACTIVE,
      tenantId: data.tenantId || undefined,
    },
    select: userSelect,
  });
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  const nextData: Record<string, unknown> = {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    status: data.status,
    tenantId: data.tenantId,
  };

  Object.keys(nextData).forEach((key) => {
    if (nextData[key] === undefined || nextData[key] === "") {
      delete nextData[key];
    }
  });

  if (data.password) {
    nextData.password = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: nextData,
    select: userSelect,
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
