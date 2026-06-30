import { z } from "zod";

const taskBaseSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().optional().nullable(),
    dueDate: z.string().trim().min(1).optional().nullable().or(z.literal("")),
    reminderAt: z.string().trim().min(1).optional().nullable().or(z.literal("")),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
    companyId: z.string().trim().min(1).optional().nullable().or(z.literal("")),
    leadId: z.string().trim().min(1).optional().nullable().or(z.literal("")),
    assignedToId: z.string().trim().min(1).optional().nullable().or(z.literal("")),
  })
  .strict();

export const createTaskSchema = taskBaseSchema;
export const updateTaskSchema = taskBaseSchema.partial();
