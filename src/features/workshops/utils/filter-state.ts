import { LIFECYCLE_ORDER, type WorkshopListFilters, type WorkshopStatus } from "../types";

export const WORKSHOPS_PAGE_SIZE = 20;

/** URLSearchParams → filters (invalid values dropped, page clamped). Pure. */
export function parseWorkshopFilters(params: URLSearchParams): WorkshopListFilters {
  const pageRaw = Number.parseInt(params.get("page") ?? "1", 10);
  const statusRaw = params.get("status");
  const governorate = params.get("governorate")?.trim();

  return {
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    search: params.get("search")?.trim() || undefined,
    governorate: governorate || undefined,
    district: params.get("district")?.trim() || undefined,
    status: LIFECYCLE_ORDER.includes(statusRaw as WorkshopStatus)
      ? (statusRaw as WorkshopStatus)
      : undefined,
  };
}

/** Filters → query string (omits defaults so URLs stay clean). Pure. */
export function filtersToSearchParams(filters: WorkshopListFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.governorate) {
    params.set("governorate", filters.governorate);
  }
  if (filters.district) {
    params.set("district", filters.district);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }

  return params;
}

export function filtersToQueryString(filters: WorkshopListFilters): string {
  const query = filtersToSearchParams(filters).toString();
  return query ? `?${query}` : "";
}
