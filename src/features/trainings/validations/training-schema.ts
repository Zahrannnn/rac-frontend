import { z } from "zod";
import { GOVERNORATES } from "@/shared/constants/egypt";
import { MAX_TITLE, MAX_NOTES, MAX_VENUE } from "@/shared/validation/constants";
import { VALIDATION_MESSAGES as M } from "@/shared/validation/messages";

const governorateValues = GOVERNORATES as readonly [string, ...string[]];

/** Mirrors CreateTrainingRequestValidator (Addendum 2). */
export const createTrainingSchema = z
  .object({
    trainerName: z.string().trim().min(1, { message: M.required }).max(128, { message: M.maxLength }),
    trainerKey: z.string().trim().max(64, { message: M.maxLength }).optional().or(z.literal("")),
    title: z.string().trim().max(MAX_TITLE, { message: M.maxLength }).optional().or(z.literal("")),
    venue: z.string().trim().min(1, { message: M.required }).max(MAX_VENUE, { message: M.maxLength }),
    governorate: z.enum(governorateValues, { message: M.governorateInvalid }),
    startAtUtc: z.string().min(1, { message: M.required }),
    endAtUtc: z.string().min(1, { message: M.required }),
    notes: z.string().trim().max(MAX_NOTES, { message: M.maxLength }).optional().or(z.literal("")),
  })
  .refine((v) => Date.parse(v.endAtUtc) > Date.parse(v.startAtUtc), {
    path: ["endAtUtc"],
    message: M.dateOrder,
  });
