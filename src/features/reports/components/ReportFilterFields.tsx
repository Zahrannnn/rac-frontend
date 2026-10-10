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

const WORKSHOP_STATUSES = ["Draft", "Submitted", "Complete", "Incomplete"] as const;
const WORKSHOP_TYPES = [
  "Formal",
  "Informal",
  "Freelance",
  "AuthorizedServiceCenter",
  "Other",
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
}: {
  supported: readonly string[];
  filters: ReportFilters;
  onFilterChange: (key: keyof ReportFilters, value: string) => void;
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
