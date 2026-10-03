import { z } from "zod";
import { GOVERNORATES } from "@/shared/constants/egypt";
import { isEgyptianMobile } from "@/shared/validation/mobile";
import { LIFECYCLE_TRANSITIONS, type WorkshopStatus } from "../types";

const TELEPHONE_REGEX = /^[0-9+\-()\s]{6,16}$/;

const governorateValues = GOVERNORATES as readonly [string, ...string[]];

export const basicInfoSchema = z.object({
  nameEn: z.string().trim().min(1).max(200),
  nameAr: z.string().trim().max(200).optional().or(z.literal("")),
  ownerName: z.string().trim().min(1).max(128),
  mobile: z.string().trim().refine(isEgyptianMobile),
  telephone: z
    .string()
    .trim()
    .regex(TELEPHONE_REGEX)
    .optional()
    .or(z.literal("")),
  type: z.enum(["Formal", "Informal", "Freelance", "AuthorizedServiceCenter", "Other"]),
  activities: z.string().trim().max(500).optional().or(z.literal("")),
  numberOfTechnicians: z.number().int().min(0).max(1000).nullable(),
});

export type BasicInfoValues = z.infer<typeof basicInfoSchema>;

export const locationSchema = z
  .object({
    governorate: z.enum(governorateValues),
    district: z.string().trim().max(64).optional().or(z.literal("")),
    address: z.string().trim().min(1).max(400),
    latitude: z.number().min(21.0).max(32.0).nullable(),
    longitude: z.number().min(24.0).max(37.0).nullable(),
  })
  .refine((values) => (values.latitude === null) === (values.longitude === null), {
    path: ["latitude"],
  });

export type LocationValues = z.infer<typeof locationSchema>;

/**
 * Other-district rule composed with the forms' local escape-hatch state: when
 * "Other (not listed)" is selected, the manual entry is required. The issue lands
 * on `district` with a dictionary key. The sentinel never enters form state —
 * `district` carries what gets submitted (picked value or trimmed manual text).
 */
export const districtChoiceSchema = z
  .object({
    district: z.string().trim().max(64).optional().or(z.literal("")),
    otherSelected: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.otherSelected && !(value.district ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["district"],
        message: "validation.districtRequired",
      });
    }
  });

export const editWorkshopSchema = z
  .object({
    nameEn: z.string().trim().min(1).max(200),
    nameAr: z.string().trim().max(200).optional().or(z.literal("")),
    ownerName: z.string().trim().min(1).max(128),
    mobile: z.string().trim().refine(isEgyptianMobile),
    telephone: z.string().trim().regex(TELEPHONE_REGEX).optional().or(z.literal("")),
    type: z.enum(["Formal", "Informal", "Freelance", "AuthorizedServiceCenter", "Other"]),
    governorate: z.enum(governorateValues),
    district: z.string().trim().max(64).optional().or(z.literal("")),
    address: z.string().trim().min(1).max(400),
    activities: z.string().trim().max(500).optional().or(z.literal("")),
    numberOfTechnicians: z.number().int().min(0).max(1000).nullable(),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    latitude: z.number().min(21.0).max(32.0).nullable(),
    longitude: z.number().min(24.0).max(37.0).nullable(),
  })
  .refine((values) => (values.latitude === null) === (values.longitude === null), {
    path: ["latitude"],
  });

export type EditWorkshopValues = z.infer<typeof editWorkshopSchema>;

/** Status-transition guard mirrored from WorkshopLifecycle (server re-validates). */
export function canTransition(from: WorkshopStatus, to: WorkshopStatus): boolean {
  return LIFECYCLE_TRANSITIONS[from].includes(to);
}
