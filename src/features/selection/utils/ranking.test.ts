import { describe, expect, it } from "vitest";
import { makeRanked } from "./test-fixtures";
import {
  DEFAULT_SORT,
  filterByGovernorate,
  nextSort,
  sortRanking,
  tierForRank,
} from "./ranking";

describe("tierForRank", () => {
  it("marks the first 150 ranks as recommended", () => {
    expect(tierForRank(1)).toBe("recommended");
    expect(tierForRank(150)).toBe("recommended");
  });

  it("marks ranks 151–200 as reserve", () => {
    expect(tierForRank(151)).toBe("reserve");
    expect(tierForRank(200)).toBe("reserve");
  });

  it("marks everything beyond the reserve window as none", () => {
    expect(tierForRank(201)).toBe("none");
    expect(tierForRank(999)).toBe("none");
  });
});

describe("filterByGovernorate", () => {
  const rows = [
    makeRanked({ rank: 1, governorate: "Cairo" }),
    makeRanked({ rank: 2, governorate: "Giza" }),
    makeRanked({ rank: 3, governorate: "Cairo" }),
  ];

  it("returns all rows when no governorate is set", () => {
    expect(filterByGovernorate(rows, undefined)).toHaveLength(3);
  });

  it("keeps only matching rows", () => {
    const filtered = filterByGovernorate(rows, "Cairo");
    expect(filtered.map((row) => row.rank)).toEqual([1, 3]);
  });
});

describe("sortRanking", () => {
  const rows = [
    makeRanked({ rank: 1, workshopName: "بيت التبريد", governorate: "Giza", totalWeighted: 88 }),
    makeRanked({ rank: 2, workshopName: "Ahmed AC", governorate: "Cairo", totalWeighted: 75 }),
    makeRanked({ rank: 3, workshopName: "Cold Care", governorate: "Cairo", totalWeighted: 91 }),
  ];

  it("keeps the server ranking order for the default sort", () => {
    expect(sortRanking(rows, DEFAULT_SORT).map((row) => row.rank)).toEqual([1, 2, 3]);
  });

  it("sorts by score descending and flips to ascending", () => {
    const desc = sortRanking(rows, { key: "totalWeighted", direction: "desc" });
    expect(desc.map((row) => row.totalWeighted)).toEqual([91, 88, 75]);

    const asc = sortRanking(rows, { key: "totalWeighted", direction: "asc" });
    expect(asc.map((row) => row.totalWeighted)).toEqual([75, 88, 91]);
  });

  it("sorts by name without mutating the input", () => {
    const sorted = sortRanking(rows, { key: "workshopName", direction: "asc" });
    // The "ar" collation orders Arabic names before Latin ones.
    expect(sorted.map((row) => row.workshopName)).toEqual([
      "بيت التبريد",
      "Ahmed AC",
      "Cold Care",
    ]);
    expect(rows[0].rank).toBe(1);
  });

  it("sorts by governorate", () => {
    const sorted = sortRanking(rows, { key: "governorate", direction: "asc" });
    expect(sorted.map((row) => row.governorate)).toEqual(["Cairo", "Cairo", "Giza"]);
  });
});

describe("nextSort", () => {
  it("flips direction when the same column is clicked", () => {
    expect(nextSort({ key: "rank", direction: "asc" }, "rank")).toEqual({
      key: "rank",
      direction: "desc",
    });
  });

  it("defaults score to descending on a new column", () => {
    expect(nextSort({ key: "rank", direction: "asc" }, "totalWeighted")).toEqual({
      key: "totalWeighted",
      direction: "desc",
    });
  });

  it("defaults text columns to ascending on a new column", () => {
    expect(nextSort({ key: "rank", direction: "desc" }, "workshopName")).toEqual({
      key: "workshopName",
      direction: "asc",
    });
  });
});
