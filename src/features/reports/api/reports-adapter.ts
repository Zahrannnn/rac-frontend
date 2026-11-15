import { racApi } from "@/shared/api/rac-api";
import { downloadBlob } from "@/shared/api/file-transfer";
import type { PagedResult } from "@/shared/api/paged-result";
import type {
  GasConsumptionRow,
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

/** Workshops with any gas quantity > 0 (annualized ×12 by the backend — §5). */
export async function fetchGasConsumption(): Promise<GasConsumptionRow[]> {
  const { data } = await racApi.get<GasConsumptionRow[]>("/reports/gas-consumption");
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
    // §10C per-gas bands travel as REPEATED gasBand=gas:band entries; the object value
    // must not hit the generic string branch.
    if (name === "gasBand" && value && typeof value === "object") {
      for (const [gas, band] of Object.entries(value as Record<string, string>)) {
        if (gas && band) params.append("gasBand", `${gas}:${band}`);
      }
      continue;
    }
    if (name !== "gasBand" && typeof value === "string" && value) params.set(name, value);
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
