import { describe, expect, it } from "vitest";
import {
  buildSectionPayload,
  computeWorkforceCell,
  computeWorkforceTotal,
  consentAnswer,
  isFieldValid,
  isSectionComplete,
  parseStoredSections,
} from "./answers";
import { CONSENT_SECTION, SECTIONS } from "../schema";

const row = (
  male: number | null,
  female: number | null,
  total: number | null
): { male: number | null; female: number | null; total: number | null } => ({ male, female, total });

describe("workforce auto-total", () => {
  it("totals male + female", () => {
    expect(computeWorkforceTotal({ male: 2, female: 3 })).toBe(5);
  });

  it("is null until both sexes are entered", () => {
    expect(computeWorkforceTotal({ male: 2, female: null })).toBeNull();
    expect(computeWorkforceTotal({ male: null, female: null })).toBeNull();
  });

  it("buildSectionPayload recomputes totals so clients cannot fake them", () => {
    const payload = buildSectionPayload(
      SECTIONS.find((section) => section.key === "workforce")!,
      {
        workforce: { engineers: { male: 1, female: 2, total: 999 } },
      }
    );
    expect(
      (payload.workforce as { engineers: { total: number } }).engineers.total
    ).toBe(3);
  });
});

describe("computeWorkforceCell (one matrix cell edit)", () => {
  it("editing total sets it directly, leaving the split untouched", () => {
    expect(computeWorkforceCell(row(null, null, null), "total", 8)).toEqual(row(null, null, 8));
    expect(computeWorkforceCell(row(2, 3, 5), "total", 9)).toEqual(row(2, 3, 9));
    expect(computeWorkforceCell(row(2, null, null), "total", 7)).toEqual(row(2, null, 7));
  });

  it("both sexes known → total derives from them", () => {
    expect(computeWorkforceCell(row(null, null, null), "male", 2)).toEqual(row(2, null, null));
    expect(computeWorkforceCell(row(2, null, null), "female", 3)).toEqual(row(2, 3, 5));
    expect(computeWorkforceCell(row(2, 3, 9), "female", 4)).toEqual(row(2, 4, 6));
  });

  it("clearing a cell of a DERIVED row recomputes the total (never stale)", () => {
    // (2,3,5) — 5 === 2+3, so the total was derived
    expect(computeWorkforceCell(row(2, 3, 5), "female", null)).toEqual(row(2, null, 2));
    expect(computeWorkforceCell(row(2, 3, 5), "male", null)).toEqual(row(null, 3, 3));
    expect(computeWorkforceCell(row(2, 0, 2), "male", null)).toEqual(row(null, 0, 0));
  });

  it("a one-cell edit keeps a total that was NOT derived (manual entry)", () => {
    // (2,null,7) — 7 !== 2+0, so the total was entered by hand
    expect(computeWorkforceCell(row(2, null, 7), "male", 5)).toEqual(row(5, null, 7));
    expect(computeWorkforceCell(row(null, 3, 12), "female", 4)).toEqual(row(null, 4, 12));
  });

  it("clearing both cells keeps the existing total (unknown split survives)", () => {
    expect(computeWorkforceCell(row(2, null, 7), "male", null)).toEqual(row(null, null, 7));
    expect(computeWorkforceCell(row(null, 3, 3), "female", null)).toEqual(row(null, null, 3));
  });

  it("a missing row starts from an empty split", () => {
    expect(computeWorkforceCell(undefined, "male", 2)).toEqual(row(2, null, null));
    expect(computeWorkforceCell(undefined, "total", 4)).toEqual(row(null, null, 4));
  });
});

describe("isFieldValid", () => {
  it("validates the Egyptian phone pattern", () => {
    const phone = SECTIONS.find((section) => section.key === "basicInfo")!.fields.find(
      (field) => field.key === "phoneWhatsapp"
    )!;
    expect(isFieldValid(phone, "01012345678")).toBe(true);
    expect(isFieldValid(phone, "01312345678")).toBe(false);
    expect(isFieldValid(phone, "")).toBe(false);
  });

  it("enforces int ranges (business start year)", () => {
    const year = SECTIONS.find((section) => section.key === "basicInfo")!.fields.find(
      (field) => field.key === "businessStartYear"
    )!;
    expect(isFieldValid(year, 1990)).toBe(true);
    expect(isFieldValid(year, 1949)).toBe(false);
    expect(isFieldValid(year, 2027)).toBe(false);
  });

  it("enforces enum membership", () => {
    const governorate = SECTIONS.find((section) => section.key === "basicInfo")!.fields.find(
      (field) => field.key === "governorate"
    )!;
    expect(isFieldValid(governorate, "cairo")).toBe(true);
    expect(isFieldValid(governorate, "alexandria")).toBe(false);
  });

  it("treats empty arrays as unanswered", () => {
    const vehicleTypes = SECTIONS.find((section) => section.key === "workforce")!.fields.find(
      (field) => field.key === "vehicleTypes"
    )!;
    expect(isFieldValid(vehicleTypes, [])).toBe(false);
    expect(isFieldValid(vehicleTypes, ["taxi"])).toBe(true);
  });
});

describe("isSectionComplete + consent", () => {
  it("counts an explicit no as answered (the gate is the wizard's end state, not validation)", () => {
    expect(isSectionComplete(CONSENT_SECTION, { "consent.participate": "yes" })).toBe(true);
    expect(isSectionComplete(CONSENT_SECTION, { "consent.participate": "no" })).toBe(true);
    expect(isSectionComplete(CONSENT_SECTION, {})).toBe(false);
    expect(consentAnswer({ consent: { "consent.participate": "no" } })).toBe("no");
    expect(consentAnswer({})).toBeNull();
  });

  it("likert axes require every statement answered within the scale (one mark per row)", () => {
    const axis = SECTIONS.find((section) => section.key === "orgManagement")!;
    const field = axis.fields[0];
    expect(isSectionComplete(axis, {})).toBe(false);
    expect(isFieldValid(field, { s1: "yes" })).toBe(false); // partial — rows missing
    expect(
      isFieldValid(field, { s1: "yes", s2: "maybe", s3: "no", s4: "no", s5: "no", s6: "no" })
    ).toBe(false); // value outside the scale
    const complete = Object.fromEntries(
      field.options!.map((row, index) => [row, index % 2 === 0 ? "yes" : "no"])
    );
    expect(isFieldValid(field, complete)).toBe(true);
    expect(isSectionComplete(axis, { statements: complete })).toBe(true);
  });

  it("axis 8 carries statements + priority ranking + operational challenges", () => {
    const axis = SECTIONS.find((section) => section.key === "inclusionGenderInformal")!;
    expect(axis.fields.map((field) => field.key)).toEqual([
      "statements",
      "priorityRanking",
      "operationalChallenges",
    ]);

    const ranking = axis.fields[1];
    expect(isFieldValid(ranking, { refrigerantRecoveryUnit: "3" })).toBe(false);
    expect(
      isFieldValid(ranking, Object.fromEntries(ranking.options!.map((item) => [item, "5"])))
    ).toBe(true);

    const challenges = axis.fields[2];
    expect(
      isFieldValid(
        challenges,
        Object.fromEntries(challenges.options!.map((item) => [item, "somewhat"]))
      )
    ).toBe(true);
    expect(isFieldValid(challenges, { refrigerantPrices: "yes" })).toBe(false); // wrong scale
  });

  it("workforce carries the paper's closing yes/no pair (mixed gas + gas identifier)", () => {
    const workforce = SECTIONS.find((section) => section.key === "workforce")!;
    const keys = workforce.fields.map((field) => field.key);
    expect(keys).toContain("mixedGasDetected");
    expect(keys).toContain("hasGasIdentifier");
  });
});

describe("parseStoredSections", () => {
  it("parses stored raw JSON and drops corrupt entries", () => {
    const parsed = parseStoredSections({
      consent: JSON.stringify({ "consent.participate": "yes" }),
      broken: "{not json",
      array: JSON.stringify([1, 2]),
    });
    expect(parsed.consent).toEqual({ "consent.participate": "yes" });
    expect(parsed.broken).toBeUndefined();
    expect(parsed.array).toBeUndefined();
  });
});
