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
import { useT } from "@/shared/i18n";
import type { SurveyStatus } from "../types";

export type SurveyFilter = SurveyStatus | "none" | "all";

/**
 * Queue toolbar: debounced search draft, survey-status filter, and the
 * clear-all action. State lives in SurveysPage; this is the controlled UI.
 */
export function SurveysFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  hasFilters,
  onClearFilters,
}: {
  search: string;
  onSearchChange: (next: string) => void;
  status: SurveyFilter;
  onStatusChange: (next: SurveyFilter) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  const t = useT();

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label={t("survey.search")}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-1.5">
        <Label htmlFor="survey-search" className="text-primary">
          {t("survey.search")}
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="survey-search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="ps-8"
            placeholder={t("survey.searchPlaceholder")}
          />
        </div>
      </div>
      <div className="flex w-full flex-col gap-1.5 sm:w-48">
        <Label>{t("survey.statusFilter")}</Label>
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as SurveyFilter)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("survey.allStatuses")}</SelectItem>
            <SelectItem value="none">{t("survey.statusNone")}</SelectItem>
            <SelectItem value="Draft">{t("status.Draft")}</SelectItem>
            <SelectItem value="Incomplete">{t("status.Incomplete")}</SelectItem>
            <SelectItem value="Submitted">{t("status.Submitted")}</SelectItem>
            <SelectItem value="Complete">{t("status.Complete")}</SelectItem>
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
