import type { DashboardFilterState } from "./dashboard-filters";
import { WORKSHOP_STATUSES } from "./dashboard-filters";
import type { WorkshopStatus } from "../types";

/** URLSearchParams → dashboard filters (invalid values dropped). Pure. */
export function parseDashboardFilters(params: URLSearchParams): DashboardFilterState {
  const governorate = params.get("governorate")?.trim();
  const district = params.get("district")?.trim();
  const statusRaw = params.get("status")?.trim();
  const statusOk =
    statusRaw != null && WORKSHOP_STATUSES.includes(statusRaw as WorkshopStatus);

  return {
    governorate: governorate || "all",
    district: district || "all",
    status: statusOk ? (statusRaw as WorkshopStatus) : "all",
  };
}

/** Filters → query string (omits defaults so URLs stay clean). Pure. */
export function dashboardFiltersToSearchParams(filters: DashboardFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.governorate !== "all") {
    params.set("governorate", filters.governorate);
  }
  if (filters.district !== "all") {
    params.set("district", filters.district);
  }
  if (filters.status !== "all") {
    params.set("status", filters.status);
  }
  return params;
}

export function dashboardFiltersToQueryString(filters: DashboardFilterState): string {
  const query = dashboardFiltersToSearchParams(filters).toString();
  return query ? `?${query}` : "";
}

/** API query params for summary/map (undefined = omit). */
export function dashboardFiltersToApiParams(filters: DashboardFilterState): {
  governorate?: string;
  district?: string;
  status?: string;
} {
  return {
    governorate: filters.governorate === "all" ? undefined : filters.governorate,
    district: filters.district === "all" ? undefined : filters.district,
    status: filters.status === "all" ? undefined : filters.status,
  };
}
