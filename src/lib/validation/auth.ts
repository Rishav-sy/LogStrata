import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  returnTo: z.string().optional(),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
  returnTo: z.string().optional(),
});
