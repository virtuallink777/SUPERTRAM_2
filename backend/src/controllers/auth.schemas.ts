import { z } from "zod";

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(6),
  })

  .refine((data) => data.password === data.confirmPassword, {
    message: "Los passwords no coinciden",
    path: ["confirmPassword"],
  });

export const verificationCodeShema = z.string().min(1).max(24);
