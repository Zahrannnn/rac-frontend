import { describe, expect, it } from "vitest";
import { buildAttentionChips } from "./attention-chips";

describe("buildAttentionChips", () => {
  it("hides zeros and includes office chips for full attention", () => {
    const chips = buildAttentionChips({
      incompleteFailing: 2,
      stuckDrafts: 1,
      awaitingSelectionCount: 0,
    });

    expect(chips.map((c) => c.key)).toEqual(["incompleteFailing", "stuckDrafts"]);
  });

  it("omits office chips for assigned attention", () => {
    const chips = buildAttentionChips(
      {
        incompleteFailing: 1,
      },
      { includeOfficeChips: false }
    );

    expect(chips.map((c) => c.key)).toEqual(["incompleteFailing"]);
  });
});

describe("attention chip deep links", () => {
  it("deep-links the failing-survey chip to the wizard review step when a brief anchors it", () => {
    const chips = buildAttentionChips(
      { incompleteFailing: 2, stuckDrafts: 0, awaitingSelectionCount: 0 },
      {
        surveyBriefs: [
          {
            workshopId: "ws-77",
            workshopCode: "RAC-CAR-000077",
            status: "Incomplete",
            failingRules: 3,
          },
        ],
      }
    );

    const chip = chips.find((c) => c.key === "incompleteFailing");
    expect(chip).toBeDefined();
    expect(chip!.href).toBe("/workshops/ws-77/survey?step=review");
  });

  it("falls back to the surveys list when no failing-survey brief anchors the chip", () => {
    const chips = buildAttentionChips(
      { incompleteFailing: 1, stuckDrafts: 0, awaitingSelectionCount: 0 },
      { includeOfficeChips: false, surveyBriefs: [] }
    );

    const chip = chips.find((c) => c.key === "incompleteFailing");
    expect(chip!.href).toBe("/surveys");
  });

  it("deep-links stuck drafts to the Draft-filtered registry", () => {
    const chips = buildAttentionChips(
      {
        incompleteFailing: 0,
        stuckDrafts: 3,
        awaitingSelectionCount: 0,
      },
      { includeOfficeChips: true }
    );

    const chip = chips.find((c) => c.key === "stuckDrafts");
    expect(chip!.href).toBe("/workshops?status=Draft");
  });

  it("deep-links Complete surveys awaiting a selection run to the Complete-filtered registry", () => {
    const chips = buildAttentionChips(
      {
        incompleteFailing: 0,
        stuckDrafts: 0,
        awaitingSelectionCount: 5,
      },
      { includeOfficeChips: true }
    );

    const chip = chips.find((c) => c.key === "awaitingSelectionCount");
    expect(chip).toBeDefined();
    expect(chip!.count).toBe(5);
    expect(chip!.href).toBe("/workshops?status=Complete");
  });
});
