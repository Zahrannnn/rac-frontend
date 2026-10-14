"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useI18n, useT } from "@/shared/i18n";
import { governorateLabel } from "../utils/format";
import { LIFECYCLE_ORDER, type WorkshopListFilters, type WorkshopStatus } from "../types";

type WorkshopsFilterBarProps = {
  filters: WorkshopListFilters;
  searchDraft: string;
  districtDraft: string;
  onSearchDraftChange: (value: string) => void;
  onDistrictDraftChange: (value: string) => void;
  /** Applies a filter change (resets to page 1). */
  onFilterChange: (patch: Partial<WorkshopListFilters>) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
};

/** Registry filter panel — controlled by useWorkshopFilters in the page. */
export function WorkshopsFilterBar({
  filters,
  searchDraft,
  districtDraft,
  onSearchDraftChange,
  onDistrictDraftChange,
  onFilterChange,
  hasFilters,
  onClearFilters,
}: WorkshopsFilterBarProps) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label={t("workshops.search")}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <Label htmlFor="workshop-search" className="text-primary">
          {t("workshops.search")}
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="workshop-search"
            value={searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
            className="ps-8"
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <Label>{t("workshops.governorateFilter")}</Label>
        <Select
          value={filters.governorate ?? "all"}
          onValueChange={(value) => onFilterChange({ governorate: value === "all" ? undefined : value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("workshops.allGovernorates")}</SelectItem>
            {GOVERNORATES.map((governorate) => (
              <SelectItem key={governorate} value={governorate}>
                {governorateLabel(governorate, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-44">
        <Label htmlFor="workshop-district">{t("workshops.filterDistrict")}</Label>
        <Input
          id="workshop-district"
          value={districtDraft}
          onChange={(event) => onDistrictDraftChange(event.target.value)}
          placeholder={t("workshops.districtHint")}
        />
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-40">
        <Label>{t("workshops.statusFilter")}</Label>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            onFilterChange({ status: value === "all" ? undefined : (value as WorkshopStatus) })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("workshops.allStatuses")}</SelectItem>
            {LIFECYCLE_ORDER.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`status.${status}` as const)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          className="text-[var(--secondary)] hover:text-[var(--secondary)]"
          onClick={onClearFilters}
        >
          <X data-icon="inline-start" />
          {t("workshops.clearFilters")}
        </Button>
      ) : null}
    </section>
  );
}
