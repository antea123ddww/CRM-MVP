import { z } from "zod";

const leadBaseSchema = z
  .object({
    companyId: z.string().trim().min(1),
    assignedToId: z.string().trim().min(1).optional().nullable(),
    source: z.string().trim().optional().nullable(),
    status: z
      .enum([
        "NEW",
        "CONTACTED",
        "QUALIFIED",
        "PROPOSAL_SENT",
        "NEGOTIATION",
        "CONVERTED",
        "LOST",
      ])
      .optional(),
    estimatedValue: z.coerce.number().nonnegative().optional().nullable(),
  })
  .strict();

export const createLeadSchema = leadBaseSchema;
export const updateLeadSchema = leadBaseSchema.partial();
