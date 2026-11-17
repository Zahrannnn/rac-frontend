"use client";

import { DateRangePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOVERNORATES } from "@/shared/constants/egypt";
import { useT } from "@/shared/i18n";
import { useTrainers } from "../hooks/use-reports";
import type { ReportFilters } from "../types";
// COMING SOON (2026-11-17 user request): the §10C per-gas band filter is hidden
// from the UI — gasDesignation and the block below stay in the code, commented.
// import { gasDesignation } from "../utils/gas-consumption";

const WORKSHOP_STATUSES = ["Draft", "Submitted", "Complete", "Incomplete"] as const;
// COMING SOON (2026-11-17 user request): commented out with the hidden block.
// /** MAC gas vocabulary — all three gases carry quantities, so all are filterable (§10C). */
// const FILTERABLE_GASES = ["r134a", "r1234yf", "other"] as const;
// /** Band option labels live in the reports dictionary (the survey's حجم الورشة حسب
//  *  الغاز المستهلك options, verbatim). */
// const GAS_BAND_LABELS = {
//   small_lt680: "reports.gasBand.small_lt680",
//   medium_680_1360: "reports.gasBand.medium_680_1360",
//   large_gt1360: "reports.gasBand.large_gt1360",
// } as const;
// const GAS_BAND_KEYS = ["small_lt680", "medium_680_1360", "large_gt1360"] as const;
const WORKSHOP_TYPES = [
  "Independent",
  "AuthorizedServiceCenter",
  "DealerAffiliated",
] as const;

/** Single-select filter with the leading "all" sentinel option. */
function FilterSelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const t = useT();

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value ?? "all"} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("reports.filterAll")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Filter controls for one report definition, mirroring REPORT_SUPPORTED_FILTERS
 * (i.e. the backend ReportFilters.SupportedByKey). The date-range field is shown
 * when either date bound is supported. Clearing a control passes "" so the
 * owner's onFilterChange maps it back to "no filter".
 */
export function ReportFilterFields({
  supported,
  filters,
  onFilterChange,
  // onGasBandChange — commented out with the hidden §10C block below; callers
  // still pass it and the prop type keeps the wiring intact.
}: {
  supported: readonly string[];
  filters: ReportFilters;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
  /** §10C per-gas band picks — "" clears that gas's selection. */
  onGasBandChange: (gas: string, band: string) => void;
}) {
  const t = useT();
  const trainers = useTrainers();

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--navy)]">
        {t("reports.filtersTitle")}
      </legend>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {supported.includes("governorate") ? (
          <FilterSelectField
            label={t("reports.filterGovernorate")}
            value={filters.governorate}
            onChange={(value) => onFilterChange("governorate", value)}
            options={GOVERNORATES.map((governorate) => ({
              value: governorate,
              label: governorate,
            }))}
          />
        ) : null}

        {supported.includes("status") ? (
          <FilterSelectField
            label={t("reports.filterStatus")}
            value={filters.status}
            onChange={(value) => onFilterChange("status", value)}
            options={WORKSHOP_STATUSES.map((status) => ({
              value: status,
              label: t(`status.${status}` as const),
            }))}
          />
        ) : null}

        {supported.includes("type") ? (
          <FilterSelectField
            label={t("reports.filterType")}
            value={filters.type}
            onChange={(value) => onFilterChange("type", value)}
            options={WORKSHOP_TYPES.map((type) => ({
              value: type,
              label: t(`type.${type}` as const),
            }))}
          />
        ) : null}

        {/* §10C per-gas size-band filter (workshop_registry only): one row per gas —
            a dropdown of the survey's workshop-size options (verbatim labels); "all" =
            no filter for that gas.
            COMING SOON (2026-11-17 user request): hidden from the UI for now — the
            backend §10C filter stays wired; delete this comment wrapper to restore.
        {supported.includes("gasBand") ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-md border bg-card p-3 md:col-span-2">
            <Label className="text-sm font-medium">
              {t("reports.filterGasBandTitle")}
            </Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FILTERABLE_GASES.map((gas) => (
                <div key={gas} className="flex min-w-0 flex-col gap-1">
                  <Label
                    htmlFor={`report-gas-band-${gas}`}
                    className="text-xs text-muted-foreground"
                  >
                    {gasDesignation(gas, t)}
                  </Label>
                  <Select
                    value={filters.gasBand?.[gas] ?? "all"}
                    onValueChange={(value) =>
                      onGasBandChange(gas, value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger id={`report-gas-band-${gas}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("reports.filterAll")}</SelectItem>
                      {GAS_BAND_KEYS.map((band) => (
                        <SelectItem key={band} value={band}>
                          {t(GAS_BAND_LABELS[band])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        ) : null} */}

        {supported.includes("dateFrom") || supported.includes("dateTo") ? (
          <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="report-date-range">{t("reports.filterDateRange")}</Label>
            <DateRangePicker
              id="report-date-range"
              value={{
                from: filters.dateFrom?.slice(0, 10),
                to: filters.dateTo?.slice(0, 10),
              }}
              onChange={(range) => {
                onFilterChange("dateFrom", range.from ? `${range.from}T00:00:00Z` : "");
                onFilterChange("dateTo", range.to ? `${range.to}T23:59:59Z` : "");
              }}
            />
          </div>
        ) : null}

        {supported.includes("trainer") ? (
          <FilterSelectField
            id="report-trainer"
            label={t("reports.filterTrainer")}
            value={filters.trainer}
            onChange={(value) => onFilterChange("trainer", value === "all" ? "" : value)}
            options={(trainers.data ?? []).map((trainer) => ({
              value: trainer.name,
              label: trainer.name,
            }))}
          />
        ) : null}

        {supported.includes("workshopId") ? (
          <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="report-workshop">{t("reports.filterWorkshopId")}</Label>
            <Input
              id="report-workshop"
              dir="ltr"
              value={filters.workshopId ?? ""}
              onChange={(event) => onFilterChange("workshopId", event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
        ) : null}

        {supported.includes("userId") ? (
          <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="report-user">{t("reports.filterUserId")}</Label>
            <Input
              id="report-user"
              dir="ltr"
              value={filters.userId ?? ""}
              onChange={(event) => onFilterChange("userId", event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}
