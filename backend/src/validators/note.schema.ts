import { z } from "zod";

export const createNoteSchema = z
  .object({
    content: z.string().trim().min(1),
    companyId: z.string().trim().min(1).optional().nullable(),
    contactId: z.string().trim().min(1).optional().nullable(),
    leadId: z.string().trim().min(1).optional().nullable(),
    dealId: z.string().trim().min(1).optional().nullable(),
  })
  .strict();

export const updateNoteSchema = z
  .object({
    content: z.string().trim().min(1),
  })
  .strict();
