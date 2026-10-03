import { z } from "zod";
import { isEgyptianMobile } from "@/shared/validation/mobile";
import { USER_ROLES, type UserRole } from "../types";

/** Mirrors CreateUserRequestValidator on the backend. */
export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: z.string().trim().min(1).max(254).email(),
  fullName: z.string().trim().min(1).max(128),
  password: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/\d/),
  role: z.enum(USER_ROLES as [UserRole, ...UserRole[]]),
  phone: z
    .string()
    .trim()
    .refine(isEgyptianMobile)
    .optional()
    .or(z.literal("")),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const USER_FIELD_MESSAGES: Record<keyof CreateUserFormValues, string> = {
  username: "admin.users.usernameInvalid",
  email: "admin.users.emailInvalid",
  fullName: "admin.users.fullNameRequired",
  password: "admin.users.passwordInvalid",
  role: "admin.users.roleRequired",
  phone: "admin.users.phoneInvalid",
};

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(128),
  email: z.string().trim().min(1).max(254).email(),
  phone: z
    .string()
    .trim()
    .refine(isEgyptianMobile)
    .optional()
    .or(z.literal("")),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8)
    .regex(/[a-zA-Z]/)
    .regex(/\d/),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
