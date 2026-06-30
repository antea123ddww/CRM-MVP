import { z } from "zod";

export const saveSettingSchema = z
  .object({
    key: z.string().trim().min(1),
    value: z.string(),
  })
  .strict();
