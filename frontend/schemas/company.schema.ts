import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "Company name is required"),
  taxNumber: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});

export type CompanyFormValues = z.infer<typeof companySchema>;