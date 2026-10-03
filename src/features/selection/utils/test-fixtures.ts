import type { RankedWorkshop } from "../types";

export function makeRanked(overrides: Partial<RankedWorkshop> = {}): RankedWorkshop {
  return {
    rank: 1,
    workshopId: "00000000-0000-0000-0000-000000000001",
    workshopCode: "RAC-CAR-000001",
    workshopName: "ورشة الاختبار",
    governorate: "Cairo",
    totalWeighted: 80,
    ...overrides,
  };
}
