import { z } from "zod";
import catchErrors from "../utils/catchErrors";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string(),
    confirmPassword: z.string(),
    userAgent: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const registerHandler = catchErrors(async (req, res) => {
  // validate request
  const request = registerSchema.safeParse({
    ...req.body,
    userAgent: req.headers["user-agent"],
  });

  // call services

  // return response
});
