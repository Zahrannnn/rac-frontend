/** Reports module — contracts mirror ReportEndpoints.cs (schedules are legacy, not surfaced). */

export type ReportDefinition = {
  id: string;
  key: string;
  name: string;
  nameAr: string | null;
  description: string;
  defaultFrequency: "OnDemand" | "Weekly" | "Monthly" | "Quarterly";
};

/**
 * Stored format of a run (GET /reports/runs keeps returning Format). Historical
 * runs may be Json/Csv; generation is XLSX-only, so new runs are always Xlsx.
 */
export type ReportFormat = "Json" | "Csv" | "Xlsx";

export type ReportFilters = {
  governorate?: string;
  status?: string;
  workshopId?: string;
  dateFrom?: string;
  dateTo?: string;
  trainer?: string;
  userId?: string;
  type?: string;
};

export type ReportRun = {
  id: string;
  reportKey: string;
  format: ReportFormat;
  rowCount: number;
  durationMs: number;
  requestedBy: string | null;
  trigger: string;
  generatedAtUtc: string;
};

export type ReportRunFilters = {
  page: number;
  reportKey?: string;
  /**
   * Override the page size (backend clamps to 1–100). The runs table uses the
   * REPORTS_PAGE_SIZE default; the analytics sample fetches the latest 100.
   */
  pageSize?: number;
};

/** Mirrors ReportFilters.SupportedByKey on the backend. */
export const REPORT_SUPPORTED_FILTERS: Record<string, readonly string[]> = {
  workshop_status_summary: [],
  governorate_coverage: [],
  workshop_registry: ["governorate", "status", "type", "dateFrom", "dateTo"],
  survey_validation: ["governorate", "status", "dateFrom", "dateTo"],
  selection_recommended: [],
  technician_registry: ["governorate", "workshopId", "status"],
  training_records: ["governorate", "trainer", "dateFrom", "dateTo"],
  equipment_deliveries: ["governorate", "dateFrom", "dateTo"],
  audit_user_activity: ["userId", "dateFrom", "dateTo"],
};

export const REPORTS_PAGE_SIZE = 20;
