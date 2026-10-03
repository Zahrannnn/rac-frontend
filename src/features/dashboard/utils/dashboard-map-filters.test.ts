import { describe, expect, it } from "vitest";
import type { WorkshopMapPoint } from "../types";
import { filterMapPoints } from "./dashboard-map-filters";

describe("filterMapPoints", () => {
  const points: WorkshopMapPoint[] = [
    {
      workshopId: "1",
      code: "A",
      nameEn: "Cairo Shop",
      nameAr: null,
      governorate: "Cairo",
      district: "Nasr",
      status: "Draft",
      latitude: 30,
      longitude: 31,
    },
    {
      workshopId: "2",
      code: "B",
      nameEn: "Giza Shop",
      nameAr: null,
      governorate: "Giza",
      district: null,
      status: "Complete",
      latitude: 29.9,
      longitude: 31.2,
    },
  ];

  it("returns all when filters are all", () => {
    expect(
      filterMapPoints(points, { governorate: "all", district: "all", status: "all" })
    ).toHaveLength(2);
  });

  it("filters by governorate and status", () => {
    expect(
      filterMapPoints(points, { governorate: "Cairo", district: "all", status: "all" }).map(
        (p) => p.code
      )
    ).toEqual(["A"]);
    expect(
      filterMapPoints(points, { governorate: "all", district: "all", status: "Complete" }).map(
        (p) => p.code
      )
    ).toEqual(["B"]);
  });

  it("matches district contains (case-insensitive); null districts never match", () => {
    expect(
      filterMapPoints(points, { governorate: "all", district: "nas", status: "all" }).map(
        (p) => p.code
      )
    ).toEqual(["A"]);
    expect(
      filterMapPoints(points, { governorate: "all", district: "Doclea", status: "all" })
    ).toHaveLength(0);
  });
});
