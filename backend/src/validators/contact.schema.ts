import { z } from "zod";

const contactBaseSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: z.string().trim().optional(),
    position: z.string().trim().optional(),
    companyId: z.string().trim().min(1),
  })
  .strict();

export const createContactSchema = contactBaseSchema;
export const updateContactSchema = contactBaseSchema.partial();
