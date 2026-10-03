import { totalPagesOf } from "@/shared/utils/pagination";
import { racApi } from "@/shared/api/rac-api";
import type { PagedResult, Workshop } from "@/features/workshops/types";
import type { DashboardFilterState } from "../utils/dashboard-filters";
import { DEFAULT_FILTERS } from "../utils/dashboard-filters";
import { dashboardFiltersToApiParams } from "../utils/dashboard-url-filters";
import type { DashboardMapResponse, DashboardSummary, WorkshopMapPoint } from "../types";

/** GET /dashboard/summary — role-shaped; optional governorate/district/status filters. */
export async function fetchDashboardSummary(
  filters: DashboardFilterState = DEFAULT_FILTERS
): Promise<DashboardSummary> {
  const { data } = await racApi.get<DashboardSummary>("/dashboard/summary", {
    params: dashboardFiltersToApiParams(filters),
  });
  return data;
}

/**
 * GET /dashboard/map — workshops with GPS.
 * Falls back to paging /workshops when the map route is missing (API not restarted yet).
 */
export async function fetchDashboardMap(
  filters: DashboardFilterState = DEFAULT_FILTERS
): Promise<DashboardMapResponse> {
  try {
    const { data } = await racApi.get<DashboardMapResponse>("/dashboard/map", {
      params: dashboardFiltersToApiParams(filters),
    });
    return data;
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 404 || status === 405) {
      return fetchMapPointsFromWorkshops(filters);
    }
    throw error;
  }
}

// WHY: hard safety cap on the /workshops fallback paging — 50 pages x 100 rows/page
// = 5000 workshops maximum. It bounds the loop if a malformed response keeps claiming
// more pages, and puts a documented limit on silent truncation (previously an accidental
// `page <= 5` cut the map off at ~500 workshops with no indication).
const MAP_FALLBACK_MAX_PAGES = 50;

async function fetchMapPointsFromWorkshops(
  filters: DashboardFilterState
): Promise<DashboardMapResponse> {
  const points: WorkshopMapPoint[] = [];
  let page = 1;
  let totalPages = 1;
  const api = dashboardFiltersToApiParams(filters);

  do {
    const { data } = await racApi.get<PagedResult<Workshop>>("/workshops", {
      params: { page, pageSize: 100, ...api },
    });

    for (const workshop of data.items) {
      if (workshop.latitude === null || workshop.longitude === null) {
        continue;
      }
      points.push({
        workshopId: workshop.id,
        code: workshop.code,
        nameEn: workshop.nameEn,
        nameAr: workshop.nameAr,
        governorate: workshop.governorate,
        district: workshop.district ?? null,
        status: workshop.status,
        latitude: workshop.latitude,
        longitude: workshop.longitude,
      });
    }

    // Page until the feed is exhausted per its own pagination metadata; a bad
    // totalCount (NaN) or pageSize (0 → Infinity) degrades safely via the cap.
    totalPages = totalPagesOf(data.totalCount, data.pageSize);
    page += 1;
  } while (page <= totalPages && page <= MAP_FALLBACK_MAX_PAGES);

  return { points };
}
