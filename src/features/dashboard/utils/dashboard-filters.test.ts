import { describe, expect, it } from "vitest";
import {
  filterGovernorates,
  filterStatuses,
  filteredWorkshopTotal,
  progressPercent,
  surveyMetrics,
} from "./dashboard-filters";

describe("dashboard-filters", () => {
  const byStatus = [
    { status: "Draft" as const, count: 10 },
    { status: "Complete" as const, count: 10 },
  ];
  const byGovernorate = [
    { governorate: "Cairo", count: 12 },
    { governorate: "Giza", count: 8 },
  ];

  it("computes Complete progress percent (Scored is gone — ADR-0004)", () => {
    expect(progressPercent(byStatus, 20)).toBe(50);
    expect(progressPercent(byStatus, 0)).toBe(0);
  });

  it("filters governorates and statuses", () => {
    expect(filterGovernorates(byGovernorate, "Cairo")).toEqual([
      { governorate: "Cairo", count: 12 },
    ]);
    expect(filterStatuses(byStatus, "Draft")).toEqual([{ status: "Draft", count: 10 }]);
  });

  it("resolves hero total from active filters", () => {
    const summary = {
      totalWorkshops: 20,
      byStatus,
      byGovernorate,
      pulse: { rankedCount: 5, recommendedTarget: 150 },
    };
    expect(
      filteredWorkshopTotal(summary, { governorate: "all", district: "all", status: "all" })
    ).toBe(20);
    expect(
      filteredWorkshopTotal(summary, { governorate: "Giza", district: "all", status: "all" })
    ).toBe(8);
    expect(
      filteredWorkshopTotal(summary, { governorate: "all", district: "all", status: "Draft" })
    ).toBe(10);
  });

  describe("surveyMetrics (single pass over survey briefs)", () => {
    const surveys = [
      { workshopId: "w1", workshopCode: "RAC-CAR-000001", status: "Complete" as const, failingRules: 0 },
      { workshopId: "w2", workshopCode: "RAC-CAR-000002", status: "Incomplete" as const, failingRules: 2 },
      { workshopId: "w3", workshopCode: "RAC-CAR-000003", status: "Incomplete" as const, failingRules: 0 },
    ];

    it("counts Complete/Incomplete and collects only failing Incomplete surveys", () => {
      expect(surveyMetrics(surveys)).toEqual({
        complete: 1,
        incomplete: 2,
        failing: [surveys[1]],
      });
    });

    it("returns zeros and no failing entries for an empty list", () => {
      expect(surveyMetrics([])).toEqual({ complete: 0, incomplete: 0, failing: [] });
    });
  });
});
