import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
}).strict();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const forgotPasswordSchema = z
  .object({ email: z.string().trim().toLowerCase().email() })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32),
    password: z.string().min(8),
  })
  .strict();
