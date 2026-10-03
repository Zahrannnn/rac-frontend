import { describe, expect, it } from "vitest";
import {
  filtersToSearchParams,
  parseWorkshopFilters,
} from "./filter-state";

describe("parseWorkshopFilters", () => {
  it("defaults to page 1 with no filters", () => {
    expect(parseWorkshopFilters(new URLSearchParams())).toEqual({ page: 1 });
  });

  it("reads all supported params", () => {
    const params = new URLSearchParams(
      "page=3&search=nasr&governorate=Cairo&status=Draft"
    );
    expect(parseWorkshopFilters(params)).toEqual({
      page: 3,
      search: "nasr",
      governorate: "Cairo",
      status: "Draft",
    });
  });

  it("drops invalid statuses and clamps bad pages", () => {
    const params = new URLSearchParams("page=-2&status=Bogus&governorate=");
    const filters = parseWorkshopFilters(params);
    expect(filters.page).toBe(1);
    expect(filters.status).toBeUndefined();
    expect(filters.governorate).toBeUndefined();
  });
});

describe("filtersToSearchParams", () => {
  it("round-trips through the URL", () => {
    const filters = parseWorkshopFilters(new URLSearchParams("page=2&search=ac&status=Scored"));
    const roundTripped = parseWorkshopFilters(filtersToSearchParams(filters));
    expect(roundTripped).toEqual(filters);
  });

  it("omits defaults so URLs stay clean", () => {
    expect(filtersToSearchParams({ page: 1 }).toString()).toBe("");
  });
});
