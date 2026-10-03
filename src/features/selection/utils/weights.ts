import { CRITERIA } from "./criteria";

/**
 * Weights-panel validation mirroring UpdateWeightsRequestValidator:
 * all 7 criteria present, each 0–100, and the sum within 0.01 of 100.
 */
export type WeightDraft = Record<string, string>;

export type WeightsValidation = {
  values: { criterionKey: string; weightPercent: number }[];
  total: number;
  totalValid: boolean;
  rangeErrors: Record<string, boolean>;
  parseErrors: Record<string, boolean>;
  valid: boolean;
};

export function validateWeights(draft: WeightDraft): WeightsValidation {
  const rangeErrors: Record<string, boolean> = {};
  const parseErrors: Record<string, boolean> = {};
  const values: { criterionKey: string; weightPercent: number }[] = [];

  for (const criterion of CRITERIA) {
    const raw = (draft[criterion.key] ?? "").trim();
    const parsed = Number(raw);

    if (raw === "" || !Number.isFinite(parsed)) {
      parseErrors[criterion.key] = true;
      continue;
    }
    if (parsed < 0 || parsed > 100) {
      rangeErrors[criterion.key] = true;
      continue;
    }
    values.push({ criterionKey: criterion.key, weightPercent: parsed });
  }

  const total =
    values.length === CRITERIA.length
      ? values.reduce((sum, value) => sum + value.weightPercent, 0)
      : Number.NaN;
  // The backend tolerates a 0.01 drift; the UI asks for the exact sum.
  const totalValid = Number.isFinite(total) && Math.abs(total - 100) < 0.01;

  return {
    values,
    total,
    totalValid,
    rangeErrors,
    parseErrors,
    valid: totalValid && Object.keys(rangeErrors).length === 0 && Object.keys(parseErrors).length === 0,
  };
}

export function draftFromWeights(weights: { criterionKey: string; weightPercent: number }[]): WeightDraft {
  const draft: WeightDraft = {};
  for (const criterion of CRITERIA) {
    const match = weights.find((weight) => weight.criterionKey === criterion.key);
    draft[criterion.key] = match ? String(match.weightPercent) : "";
  }
  return draft;
}
