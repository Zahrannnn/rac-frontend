import { z } from "zod";
import { isEgyptianMobile } from "@/shared/validation/mobile";
import { isValidEgyptianNationalId } from "@/shared/utils/egyptian-national-id";

/** Registry attribute keys (REGISTRY-GAS-SPEC §1 + §10A) — the camelCase role keys the
 *  backend stores; labels render per locale in the forms. Gender and age are NOT form
 *  fields — they derive from the national ID (§10B). */
export const EMPLOYMENT_TYPE_KEYS = ["engineer", "observer", "technician", "assistant"] as const;

/** نوع العمالة keys (REGISTRY-GAS-SPEC §11) — the camelCase nature keys the backend
 *  stores; labels render per locale. حر = مستقل is ONE option (2026-11-15 correction),
 *  keyed "selfEmployed" so the person label never collides with the workshop-type
 *  ورشة مستقلة. */
export const EMPLOYMENT_NATURE_KEYS = [
  "permanent",
  "temporary",
  "selfEmployed",
  "other",
] as const;

/** خبرات سابقة في وسائط التبريد الحديثة (§11) — the yes/no select draft ("") while
 *  unpicked; the payload maps yes/no → true/false and "" → omitted (keep). */
export const MODERN_EXPERIENCE_DRAFTS = ["yes", "no"] as const;

/** Mirrors the backend CreateTechnicianRequestValidator (optional national ID carrying
 *  the FULL Egyptian formula — real birth date, official governorate code, check digit —
 *  optional Egyptian mobile, 0–60 years of experience). Format rules apply only when
 *  non-empty; blank values are sent as omitted (create) / null (edit) per the nullable
 *  contract. workshopId admits "" — the "بدون ورشة" draft for free technicians; the
 *  payload maps it to null. yearsOfExperience also admits "" — the cleared input draft;
 *  mode-aware submission parsing decides whether that is valid (edit: leave unchanged).
 *  Registry attribute fields (REGISTRY-GAS-SPEC §1 + §10A): employmentType accepts only
 *  its camelCase role keys ("" = the unset select draft), employer/address free text
 *  capped at 256. Gender and age derive from the national ID (§10B) — never entered. */
export const technicianSchema = z.object({
  fullName: z.string().trim().min(1).max(128),
  fullNameAr: z.string().trim().max(128).optional().or(z.literal("")),
  nationalId: z.string().trim().refine((value) => value === "" || isValidEgyptianNationalId(value)),
  mobile: z.string().trim().refine((value) => value === "" || isEgyptianMobile(value)),
  workshopId: z.string(),
  specialty: z.string().trim().max(128).optional().or(z.literal("")),
  yearsOfExperience: z.number().int().min(0).max(60).or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  employmentType: z.enum(EMPLOYMENT_TYPE_KEYS).or(z.literal("")),
  employmentNature: z.enum(EMPLOYMENT_NATURE_KEYS).or(z.literal("")),
  hasModernRefrigerantExperience: z.enum(MODERN_EXPERIENCE_DRAFTS).or(z.literal("")),
  // §11 correction: جهة العمل IS the workshop — no separate employer field; the
  // workshop select is the employer.
  address: z.string().trim().max(256).optional().or(z.literal("")),
});

export type TechnicianFormValues = z.infer<typeof technicianSchema>;
