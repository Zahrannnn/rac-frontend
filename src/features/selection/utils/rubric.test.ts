import { describe, expect, it } from "vitest";
import { bandLabel, criterionLabel, RUN_TARGETS, tierLabelKey, toTranslationKey } from "./rubric";

describe("toTranslationKey", () => {
  it("passes through keys the dictionary defines", () => {
    expect(toTranslationKey("rubric.band.legal_full", "rubric.band.none")).toBe(
      "rubric.band.legal_full"
    );
  });

  it("falls back to a real dictionary key for unknown backend keys", () => {
    expect(toTranslationKey("rubric.band.time_travel", "rubric.band.none")).toBe("rubric.band.none");
    expect(toTranslationKey("rubric.participation.hypothetical", "selection.criterion.unknown")).toBe(
      "selection.criterion.unknown"
    );
  });
});

describe("criterionLabel / bandLabel", () => {
  it("maps backend label keys to dictionary keys", () => {
    expect(criterionLabel("rubric.participation.legal_status")).toBe(
      "rubric.participation.legal_status"
    );
    expect(criterionLabel("rubric.equipment.recovery_machine")).toBe(
      "rubric.equipment.recovery_machine"
    );
    expect(bandLabel("rubric.band.ownership_female")).toBe("rubric.band.ownership_female");
  });

  it("never returns an unrenderable key", () => {
    expect(criterionLabel("rubric.participation.missing")).toBe("selection.criterion.unknown");
    expect(bandLabel("rubric.band.missing")).toBe("rubric.band.none");
    expect(bandLabel("")).toBe("rubric.band.none");
  });
});

describe("RUN_TARGETS", () => {
  it("mirrors SelectionCuts.cs (participation 150+50, equipment 50+10)", () => {
    expect(RUN_TARGETS.participation).toEqual({ recommended: 150, reserve: 50 });
    expect(RUN_TARGETS.equipment).toEqual({ recommended: 50, reserve: 10 });
  });
});

describe("tierLabelKey", () => {
  it("keeps text labels for the recommended/reserve tiers and null otherwise", () => {
    expect(tierLabelKey("recommended")).toBe("selection.tier.recommended");
    expect(tierLabelKey("reserve")).toBe("selection.tier.reserve");
    expect(tierLabelKey("none")).toBeNull();
    expect(tierLabelKey("")).toBeNull();
  });
});
