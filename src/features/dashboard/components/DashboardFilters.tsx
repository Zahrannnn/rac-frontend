"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GOVERNORATES, governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { WORKSHOP_STATUSES } from "../utils/dashboard-filters";
import type { DashboardFilterState } from "../utils/dashboard-filters";

const STATUSES = WORKSHOP_STATUSES;

type DashboardFiltersProps = {
  value: DashboardFilterState;
  onChange: (next: DashboardFilterState) => void;
  showGovernorate?: boolean;
  governorateOptions?: string[];
};

export function DashboardFilters({
  value,
  onChange,
  showGovernorate = true,
  governorateOptions,
}: DashboardFiltersProps) {
  const t = useT();
  const { locale } = useI18n();
  const options = governorateOptions?.length ? governorateOptions : [...GOVERNORATES];

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
      role="search"
      aria-label={t("dashboard.filtersLabel")}
    >
      {showGovernorate ? (
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-primary">{t("dashboard.governorate")}</span>
          <Select
            value={value.governorate}
            onValueChange={(governorate) =>
              onChange({ ...value, governorate: governorate as DashboardFilterState["governorate"] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("workshops.allGovernorates")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("workshops.allGovernorates")}</SelectItem>
              {options.map((governorate) => (
                <SelectItem key={governorate} value={governorate}>
                  {governorateLabel(governorate, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      <label className="flex min-w-[10rem] flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-muted-foreground">{t("workshops.statusFilter")}</span>
        <Select
          value={value.status}
          onValueChange={(status) =>
            onChange({ ...value, status: status as DashboardFilterState["status"] })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={t("workshops.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("workshops.allStatuses")}</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
