import { z } from "zod";
import { isEgyptianMobile } from "@/shared/validation/mobile";
import {
  MAX_DESCRIPTION,
  MAX_NOTES,
  MAX_RECIPIENT_NAME,
} from "@/shared/validation/constants";
import { VALIDATION_MESSAGES as M } from "@/shared/validation/messages";

const notesSchema = z
  .string()
  .trim()
  .max(MAX_NOTES, { message: M.maxLength })
  .optional()
  .or(z.literal(""));

/** Mirrors CreateDeliveryRequestValidator (audit Part-2: equipment deliveries). */
export const createDeliverySchema = z.object({
  workshopId: z.string().min(1, { message: M.workshopRequired }),
  equipmentDescription: z
    .string()
    .trim()
    .min(1, { message: M.required })
    .max(MAX_DESCRIPTION, { message: M.maxLength }),
  recipientName: z
    .string()
    .trim()
    .min(1, { message: M.required })
    .max(MAX_RECIPIENT_NAME, { message: M.maxLength }),
  recipientPhone: z
    .string()
    .trim()
    .refine(isEgyptianMobile, { message: M.recipientPhoneInvalid })
    .optional()
    .or(z.literal("")),
  deliveredAtUtc: z
    .string()
    .min(1, { message: M.required })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: M.dateInvalid,
    }),
  notes: notesSchema,
});

export type CreateDeliveryFormValues = z.infer<typeof createDeliverySchema>;
