import { describe, expect, it } from "vitest";
import {
  countDuplicateMatches,
  decisionConfirmsCreation,
  isProbeComplete,
  type DuplicateDecision,
} from "./duplicate-actions";

describe("decisionConfirmsCreation", () => {
  it("only 'continue as new' sets the ConfirmDuplicate flag", () => {
    const decisions: DuplicateDecision[] = ["open", "confirm-new", "dismiss"];
    const confirms = decisions.map(decisionConfirmsCreation);
    expect(confirms).toEqual([false, true, false]);
  });
});

describe("isProbeComplete", () => {
  const complete = {
    nameEn: "Nasr Workshop",
    ownerName: "Samir",
    mobile: "01012345678",
    address: "1 Tahrir Sq",
    governorate: "Cairo",
  };

  it("requires all five probe fields", () => {
    expect(isProbeComplete(complete)).toBe(true);
    expect(isProbeComplete({ ...complete, address: "" })).toBe(false);
    expect(isProbeComplete({ ...complete, governorate: "  " })).toBe(false);
    expect(isProbeComplete({ ...complete, nameEn: "" })).toBe(false);
  });
});

describe("countDuplicateMatches", () => {
  it("counts matches", () => {
    expect(countDuplicateMatches([])).toBe(0);
    expect(
      countDuplicateMatches([
        { workshopId: "1", code: "RAC-CAR-00001", name: "A", governorate: "Cairo", reasons: [] },
        { workshopId: "2", code: "RAC-CAR-00002", name: "B", governorate: "Giza", reasons: [] },
      ])
    ).toBe(2);
  });
});
