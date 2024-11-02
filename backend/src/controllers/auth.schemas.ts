import { z } from "zod";

export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(6);

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

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  verificationCode: verificationCodeShema,
});
