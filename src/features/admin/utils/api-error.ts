import type { ApiError } from "@/shared/api/http-client";

/** Backend-provided message when present — surfaced in toasts. */
export function apiMessage(error: unknown): string | undefined {
  return (error as ApiError)?.message;
}
