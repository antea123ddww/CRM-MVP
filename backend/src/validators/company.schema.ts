import { z } from "zod";

const companyBaseSchema = z
  .object({
    name: z.string().trim().min(1),
    taxNumber: z.string().trim().optional(),
    industry: z.string().trim().optional(),
    website: z.string().trim().url().optional().or(z.literal("")),
    phone: z.string().trim().optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    address: z.string().trim().optional(),
    ownerId: z.string().trim().min(1).optional(),
  })
  .strict();

export const createCompanySchema = companyBaseSchema;
export const updateCompanySchema = companyBaseSchema.partial();
