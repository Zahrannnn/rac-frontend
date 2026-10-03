import type { TranslationKey } from "@/shared/i18n";
import type { CriterionField } from "../types";

/**
 * The 7 SRS criteria in the backend's scoring order (SelectionCriteria.Keys).
 * `field` is the camelCase property on WorkshopScoreResponse.
 */
export const CRITERIA: readonly {
  key: string;
  field: CriterionField;
  labelKey: TranslationKey;
}[] = [
  { key: "rac_activity", field: "racActivity", labelKey: "selection.criterion.racActivity" },
  {
    key: "technical_profile",
    field: "technicalProfile",
    labelKey: "selection.criterion.technicalProfile",
  },
  {
    key: "refrigerant_exposure",
    field: "refrigerantExposure",
    labelKey: "selection.criterion.refrigerantExposure",
  },
  {
    key: "competency_gaps",
    field: "competencyGaps",
    labelKey: "selection.criterion.competencyGaps",
  },
  {
    key: "environmental_performance",
    field: "environmentalPerformance",
    labelKey: "selection.criterion.environmentalPerformance",
  },
  { key: "commitment", field: "commitment", labelKey: "selection.criterion.commitment" },
  {
    key: "geographic_representation",
    field: "geographicRepresentation",
    labelKey: "selection.criterion.geographicRepresentation",
  },
] as const;

export function criterionLabel(key: string): TranslationKey {
  return (
    CRITERIA.find((criterion) => criterion.key === key)?.labelKey ??
    ("selection.criterion.unknown" as TranslationKey)
  );
}

/**
 * Weighted contribution of one criterion — the backend totals Σ(score × weight) / 100
 * (SelectionScoring.ComputeTotal), so each row shows score × weight / 100.
 */
export function weightedContribution(score: number, weightPercent: number): number {
  return Math.round(((score * weightPercent) / 100) * 100) / 100;
}
