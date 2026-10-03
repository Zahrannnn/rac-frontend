import { describe, expect, it } from "vitest";
import {
  dashboardFiltersToApiParams,
  dashboardFiltersToSearchParams,
  parseDashboardFilters,
} from "./dashboard-url-filters";

describe("parseDashboardFilters", () => {
  it("defaults to all when empty", () => {
    expect(parseDashboardFilters(new URLSearchParams())).toEqual({
      governorate: "all",
      district: "all",
      status: "all",
    });
  });

  it("parses governorate, district and status", () => {
    const params = new URLSearchParams("governorate=Cairo&district=Nasr&status=Draft");
    expect(parseDashboardFilters(params)).toEqual({
      governorate: "Cairo",
      district: "Nasr",
      status: "Draft",
    });
  });

  it("drops unknown status", () => {
    expect(parseDashboardFilters(new URLSearchParams("status=Nope")).status).toBe("all");
  });

  it("drops blank district", () => {
    expect(parseDashboardFilters(new URLSearchParams("district=%20")).district).toBe("all");
  });

  it("round-trips through search params", () => {
    const filters = parseDashboardFilters(
      new URLSearchParams("governorate=Giza&district=Nasr&status=Scored")
    );
    const roundTripped = parseDashboardFilters(dashboardFiltersToSearchParams(filters));
    expect(roundTripped).toEqual(filters);
  });
});

describe("dashboardFiltersToApiParams", () => {
  it("omits all-sentinels", () => {
    expect(
      dashboardFiltersToApiParams({ governorate: "all", district: "all", status: "all" })
    ).toEqual({ governorate: undefined, district: undefined, status: undefined });
  });

  it("passes concrete filters", () => {
    expect(
      dashboardFiltersToApiParams({ governorate: "Cairo", district: "Nasr", status: "Complete" })
    ).toEqual({ governorate: "Cairo", district: "Nasr", status: "Complete" });
  });
});
