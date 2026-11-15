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
  /** Per-gas size-band filter (workshop_registry only, REGISTRY-GAS-SPEC §10C) —
   *  gasKey → bandKey; sent as repeated `gasBand=gas:band` query entries. Compared
   *  AS SAVED = annual kg (MAC annualizes nothing). */
  gasBand?: Record<string, string>;
};

/** One distinct trainer identity — mirrors TrainerOptionResponse.cs. */
export type ReportTrainerOption = {
  name: string;
  key: string | null;
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
  workshop_registry: ["governorate", "status", "type", "dateFrom", "dateTo", "gasBand"],
  survey_validation: ["governorate", "status", "dateFrom", "dateTo"],
  selection_recommended: [],
  technician_registry: ["governorate", "workshopId", "status"],
  training_records: ["governorate", "trainer", "dateFrom", "dateTo"],
  // Drift fix (REGISTRY-GAS-SPEC §6/§7 item 12): the backend has long served this
  // report (SupportedByKey: governorate, workshopId, status, dateFrom, dateTo) —
  // the entry was missing here, hiding its filter fields.
  technician_training_profile: ["governorate", "workshopId", "status", "dateFrom", "dateTo"],
  equipment_deliveries: ["governorate", "dateFrom", "dateTo"],
  audit_user_activity: ["userId", "dateFrom", "dateTo"],
};

/** MAC gas vocabulary (mirrors GasVocabulary.cs — exactly these three keys). */
export const GAS_TYPE_KEYS = ["r134a", "r1234yf", "other"] as const;

/** One row of GET /reports/gas-consumption — as-saved ANNUAL kg (MAC stores
 *  annual kg; the RAC2 ×12 monthly rule never applies here). Mirrors
 *  GasConsumptionRow.cs. */
export type GasConsumptionPerGas = {
  gas: string;
  quantityKg: number;
};

export type GasConsumptionRow = {
  workshopId: string;
  code: string;
  nameAr: string | null;
  nameEn: string;
  governorate: string | null;
  latitude: number | null;
  longitude: number | null;
  annualTotalKg: number;
  perGas: GasConsumptionPerGas[];
  /** §10E: the workshop size by gas consumption — verbatim survey band labels. */
  sizeClass: { arabic: string; english: string } | null;
};

export const REPORTS_PAGE_SIZE = 20;
