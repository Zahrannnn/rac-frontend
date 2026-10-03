import { describe, expect, it } from "vitest";
import { CRITERIA } from "./criteria";
import { draftFromWeights, validateWeights } from "./weights";
import { weightsSchema } from "../validations/weights-schema";

function fullDraft(values: number[]) {
  const draft: Record<string, string> = {};
  CRITERIA.forEach((criterion, index) => {
    draft[criterion.key] = String(values[index]);
  });
  return draft;
}

describe("validateWeights", () => {
  it("accepts the default 20/15/20/15/10/10/10 split", () => {
    const result = validateWeights(fullDraft([20, 15, 20, 15, 10, 10, 10]));
    expect(result.valid).toBe(true);
    expect(result.total).toBe(100);
  });

  it("rejects when the total drifts from 100", () => {
    const result = validateWeights(fullDraft([25, 15, 20, 15, 10, 10, 10]));
    expect(result.totalValid).toBe(false);
    expect(result.valid).toBe(false);
  });

  it("accepts decimals that stay within the backend's 0.01 tolerance", () => {
    const result = validateWeights(fullDraft([20.005, 15, 20, 15, 10, 10, 10]));
    expect(result.totalValid).toBe(true);
  });

  it("rejects out-of-range weights", () => {
    const result = validateWeights(fullDraft([120, -5, 20, 15, 10, 10, 10]));
    expect(result.rangeErrors["rac_activity"]).toBe(true);
    expect(result.rangeErrors["technical_profile"]).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("rejects non-numeric and empty inputs", () => {
    const result = validateWeights({ ...fullDraft([20, 15, 20, 15, 10, 10, 10]), commitment: "abc", geographic_representation: "" });
    expect(result.parseErrors["commitment"]).toBe(true);
    expect(result.parseErrors["geographic_representation"]).toBe(true);
    expect(result.valid).toBe(false);
  });

  it("skips the total when any criterion failed to parse", () => {
    const result = validateWeights({ ...fullDraft([20, 15, 20, 15, 10, 10, 10]), commitment: "" });
    expect(Number.isNaN(result.total)).toBe(true);
  });
});

describe("validateWeights ↔ weightsSchema parity", () => {
  const numbersOf = (draft: Record<string, string>) => {
    const numbers: Record<string, number> = {};
    for (const criterion of CRITERIA) {
      const raw = (draft[criterion.key] ?? "").trim();
      numbers[criterion.key] = raw === "" ? Number.NaN : Number(raw);
    }
    return numbers;
  };

  it("agrees with the zod schema on pass/fail across edge drafts", () => {
    const cases: Record<string, string>[] = [
      fullDraft([20, 15, 20, 15, 10, 10, 10]), // exact 100 → both pass
      fullDraft([20.005, 15, 20, 15, 10, 10, 10]), // drift within 0.01 → both pass
      fullDraft([20.02, 15, 20, 15, 10, 10, 10]), // drift beyond 0.01 → both fail
      fullDraft([120, -5, 20, 15, 10, 10, 10]), // out of range → both fail
      fullDraft([100, 0, 0, 0, 0, 0, 0]), // extreme corner → both pass
      { ...fullDraft([20, 15, 20, 15, 10, 10, 10]), commitment: "abc" }, // parse → both fail
      { ...fullDraft([20, 15, 20, 15, 10, 10, 10]), rac_activity: "" }, // empty cell → both fail
    ];
    for (const draft of cases) {
      expect(validateWeights(draft).valid).toBe(weightsSchema.safeParse(numbersOf(draft)).success);
    }
  });
});

describe("draftFromWeights", () => {
  it("fills every criterion in the backend's order", () => {
    const draft = draftFromWeights([
      { criterionKey: "commitment", weightPercent: 10 },
      { criterionKey: "rac_activity", weightPercent: 20 },
    ]);
    expect(Object.keys(draft)).toEqual(CRITERIA.map((criterion) => criterion.key));
    expect(draft["rac_activity"]).toBe("20");
    expect(draft["technical_profile"]).toBe("");
  });
});
