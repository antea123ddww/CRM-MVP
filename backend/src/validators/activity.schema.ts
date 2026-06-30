import { z } from "zod";

const activityBaseSchema = z
  .object({
    type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE", "TASK"]),
    title: z.string().trim().min(1),
    content: z.string().trim().optional().nullable(),
    companyId: z.string().trim().min(1),
    contactId: z.string().trim().min(1).optional().nullable(),
    leadId: z.string().trim().min(1).optional().nullable(),
    dealId: z.string().trim().min(1).optional().nullable(),
  })
  .strict();

export const createActivitySchema = activityBaseSchema;
export const updateActivitySchema = activityBaseSchema;
