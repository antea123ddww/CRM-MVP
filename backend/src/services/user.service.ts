import bcrypt from "bcrypt";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { RequestUser, requireTenantId, tenantFilter } from "../lib/access";
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

class UserServiceError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

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

export async function createUser(data: UserInput, actor?: RequestUser) {
  if (!data.password) {
    throw new Error("Password is required");
  }

  const tenantId = requireTenantId(actor);

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new UserServiceError("User already exists", 409);
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
      tenantId,
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

export async function deleteUser(id: string, actor?: RequestUser) {
  const tenantId = requireTenantId(actor);

  if (actor?.id === id) {
    throw new UserServiceError("You cannot delete your own account", 400);
  }

  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      id: true,
      role: true,
      status: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  if (!user) {
    throw new UserServiceError("User not found", 404);
  }

  const [ownedCompanies, assignedLeads, assignedTasks, tenantAdmins] =
    await Promise.all([
      prisma.company.count({ where: { ownerId: id, tenantId } }),
      prisma.lead.count({ where: { assignedToId: id, tenantId } }),
      prisma.task.count({ where: { assignedToId: id, tenantId } }),
      user.role === Role.ADMIN
        ? prisma.user.count({
            where: { role: Role.ADMIN, status: UserStatus.ACTIVE, tenantId },
          })
        : Promise.resolve(0),
    ]);

  if (
    user.role === Role.ADMIN &&
    user.status === UserStatus.ACTIVE &&
    tenantAdmins <= 1
  ) {
    throw new UserServiceError(
      "You cannot delete the last admin in this tenant",
      400
    );
  }

  const dependencies = [
    ownedCompanies ? `${ownedCompanies} owned companies` : "",
    assignedLeads ? `${assignedLeads} assigned leads` : "",
    assignedTasks ? `${assignedTasks} assigned tasks` : "",
  ].filter(Boolean);

  if (dependencies.length) {
    throw new UserServiceError(
      `Cannot delete ${user.firstName} ${user.lastName} because they still have ${dependencies.join(
        ", "
      )}. Reassign or remove those records first.`,
      409
    );
  }

  return prisma.user.delete({ where: { id } });
}
