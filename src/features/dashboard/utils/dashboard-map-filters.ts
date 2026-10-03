import type { WorkshopMapPoint } from "../types";
import type { DashboardFilterState } from "./dashboard-filters";

/** Apply dashboard governorate/district/status filters to GPS map pins.
 * District mirrors the server's contains match (null districts never match). */
export function filterMapPoints(
  points: WorkshopMapPoint[],
  filters: DashboardFilterState
): WorkshopMapPoint[] {
  const district = filters.district === "all" ? null : filters.district.toLowerCase();
  return points.filter((point) => {
    if (filters.governorate !== "all" && point.governorate !== filters.governorate) {
      return false;
    }
    if (district && !(point.district ?? "").toLowerCase().includes(district)) {
      return false;
    }
    if (filters.status !== "all" && point.status !== filters.status) {
      return false;
    }
    return true;
  });
}
