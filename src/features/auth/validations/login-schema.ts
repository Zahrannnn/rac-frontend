import { z } from "zod";

// Mirrors LoginRequestValidator: ≤254 identifier, password ≥ 8 — the backend
// 400s below 8 chars before credentials are even judged.
export const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1).max(254),
  password: z.string().min(8),
});

export type LoginFieldErrors = Partial<Record<"usernameOrEmail" | "password", string>>;
