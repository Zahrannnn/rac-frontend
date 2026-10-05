import { racApi } from "@/shared/api/rac-api";
import { downloadBlob } from "@/shared/api/file-transfer";
import type { PagedResult } from "@/shared/api/paged-result";
import type {
  ReportDefinition,
  ReportFilters,
  ReportRun,
  ReportRunFilters,
  ReportTrainerOption,
} from "../types";
import { REPORTS_PAGE_SIZE } from "../types";

export async function fetchCatalog(): Promise<ReportDefinition[]> {
  const { data } = await racApi.get<ReportDefinition[]>("/reports/catalog");
  return data;
}

/** Distinct trainers of the caller's sessions — options for the trainer filter select. */
export async function fetchTrainers(): Promise<ReportTrainerOption[]> {
  const { data } = await racApi.get<ReportTrainerOption[]>("/trainings/trainers");
  return data;
}

/**
 * Generate a report and hand back the file as a Blob. The endpoint always
 * returns the XLSX workbook (no `format` query parameter; the server's
 * content-disposition names it `{key}.xlsx` — kept as the fallback).
 */
export function generateReport(
  key: string,
  filters: ReportFilters = {}
): Promise<{ blob: Blob; fileName: string }> {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return downloadBlob(
    racApi,
    `/reports/${encodeURIComponent(key)}${query ? `?${query}` : ""}`,
    `${key}.xlsx`
  );
}

export async function fetchRuns(filters: ReportRunFilters): Promise<PagedResult<ReportRun>> {
  const { data } = await racApi.get<PagedResult<ReportRun>>("/reports/runs", {
    params: {
      page: filters.page,
      pageSize: Math.min(Math.max(1, filters.pageSize ?? REPORTS_PAGE_SIZE), 100),
      reportKey: filters.reportKey,
    },
  });
  return data;
}
