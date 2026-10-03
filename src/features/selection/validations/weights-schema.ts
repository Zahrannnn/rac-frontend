import { z } from "zod";
import {
  WEIGHT_MAX,
  WEIGHT_MIN,
  WEIGHT_SUM_TARGET,
  WEIGHT_SUM_TOLERANCE,
} from "@/shared/validation/constants";
import { VALIDATION_MESSAGES as M } from "@/shared/validation/messages";

/** Mirrors UpdateWeightsRequestValidator: all 7 criteria, 0–100 each, sum = 100. */
export const weightsSchema = z
  .object({
    rac_activity: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
    technical_profile: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
    refrigerant_exposure: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
    competency_gaps: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
    environmental_performance: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
    commitment: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
    geographic_representation: z.number().min(WEIGHT_MIN).max(WEIGHT_MAX),
  })
  .refine(
    (w) =>
      Math.abs(
        Object.values(w).reduce<number>((sum, v) => sum + v, 0) - WEIGHT_SUM_TARGET
      ) < WEIGHT_SUM_TOLERANCE,
    { message: M.weightsSum, path: ["rac_activity"] }
  );

export type WeightsFormValues = z.infer<typeof weightsSchema>;
