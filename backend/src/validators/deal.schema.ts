import { z } from "zod";

const dealBaseSchema = z
  .object({
    title: z.string().trim().min(1),
    value: z.coerce.number().nonnegative(),
    stage: z
      .enum(["NEW", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"])
      .optional(),
    closeDate: z.string().trim().min(1).optional().nullable().or(z.literal("")),
    companyId: z.string().trim().min(1),
  })
  .strict();

export const createDealSchema = dealBaseSchema;
export const updateDealSchema = dealBaseSchema.partial();
