import { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { canViewAll, RequestUser, tenantFilter } from "../lib/access";

type TaskInput = {
  title: string;
  description?: string;
  dueDate?: string;
  reminderAt?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  companyId?: string;
  leadId?: string;
  assignedToId?: string;
};

export async function getTasks(search?: string, user?: RequestUser) {
  const filters: Prisma.TaskWhereInput[] = [];

  if (search) {
    filters.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (user?.tenantId) {
    filters.push(tenantFilter<Prisma.TaskWhereInput>(user));
  }

  if (!canViewAll(user) && user) {
    filters.push({
      OR: [
        { assignedToId: user.id },
        { company: { ownerId: user.id } },
      ],
    });
  }

  return prisma.task.findMany({
    where: filters.length ? { AND: filters } : undefined,
    include: {
      company: true,
      lead: {
        include: {
          company: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTaskById(id: string, user?: RequestUser) {
  return prisma.task.findFirst({
    where: {
      id,
      ...tenantFilter<Prisma.TaskWhereInput>(user),
      ...(!canViewAll(user) && user
        ? {
            OR: [
              { assignedToId: user.id },
              { company: { ownerId: user.id } },
            ],
          }
        : {}),
    },
    include: {
      company: true,
      lead: {
        include: {
          company: true,
        },
      },
      assignedTo: true,
    },
  });
}

export async function createTask(data: TaskInput, user?: RequestUser) {
  return prisma.task.create({
    data: {
      ...data,
      assignedToId: data.assignedToId || user?.id,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
      tenantId: user?.tenantId || undefined,
    },
  });
}

export async function updateTask(id: string, data: Partial<TaskInput>) {
  return prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      reminderAt: data.reminderAt ? new Date(data.reminderAt) : undefined,
    },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({
    where: { id },
  });
}
