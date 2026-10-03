import { describe, expect, it } from "vitest";
import { parseChanges, summarizeChanges } from "./audit-changes";

describe("parseChanges", () => {
  it("maps Modified entries into from/to pairs", () => {
    const lines = parseChanges("Modified", {
      Status: { from: "Draft", to: "Submitted" },
      Notes: { from: null, to: "تم الرصد" },
    });
    expect(lines).toEqual([
      { field: "Status", from: "Draft", to: "Submitted" },
      { field: "Notes", from: "", to: "تم الرصد" },
    ]);
  });

  it("maps Added/Deleted entries into flat snapshots", () => {
    const lines = parseChanges("Added", { Code: "RAC-CAR-000125", NumberOfTechnicians: 4 });
    expect(lines).toEqual([
      { field: "Code", to: "RAC-CAR-000125" },
      { field: "NumberOfTechnicians", to: "4" },
    ]);
  });

  it("stringifies object values", () => {
    const lines = parseChanges("Added", { Payload: { a: 1 } });
    expect(lines[0].to).toBe('{"a":1}');
  });
});

describe("summarizeChanges", () => {
  it("joins the first two fields and counts the rest", () => {
    const lines = parseChanges("Added", { A: 1, B: 2, C: 3, D: 4 });
    expect(summarizeChanges(lines)).toBe("A, B +2");
  });

  it("returns a dash for empty changes", () => {
    expect(summarizeChanges([])).toBe("—");
  });
});
