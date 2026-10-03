import { z } from "zod";
import { isEgyptianMobile } from "@/shared/validation/mobile";

/** Mirrors the backend CreateTechnicianRequestValidator (14-digit national ID,
 *  Egyptian mobile — local or international form, 0–60 years of experience).
 *  yearsOfExperience also admits "" — the cleared input draft; mode-aware
 *  submission parsing decides whether that is valid (edit: leave unchanged). */
export const technicianSchema = z.object({
  fullName: z.string().trim().min(1).max(128),
  fullNameAr: z.string().trim().max(128).optional().or(z.literal("")),
  nationalId: z.string().trim().regex(/^[23][0-9]{13}$/),
  mobile: z.string().trim().refine(isEgyptianMobile),
  workshopId: z.string().min(1),
  specialty: z.string().trim().max(128).optional().or(z.literal("")),
  yearsOfExperience: z.number().int().min(0).max(60).or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type TechnicianFormValues = z.infer<typeof technicianSchema>;
