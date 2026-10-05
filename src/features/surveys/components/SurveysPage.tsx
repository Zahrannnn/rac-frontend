"use client";

import { totalPagesOf } from "@/shared/utils/pagination";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ClipboardList, Search, X } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useWorkshops } from "@/features/workshops";
import { surveyByWorkshopId, useWorkshopSurveys } from "../hooks/use-workshop-surveys";
import type { SurveyStatus } from "../types";
import { SurveyQueue } from "./SurveyQueue";

type SurveyFilter = SurveyStatus | "none" | "all";

export function SurveysPage() {
  const router = useRouter();
  const t = useT();

  const [filters, setFilters] = useState<{ page: number; search?: string }>({ page: 1 });
  const [searchDraft, setSearchDraft] = useState("");
  const [surveyFilter, setSurveyFilter] = useState<SurveyFilter>("all");

  useEffect(() => {
    if ((filters.search ?? "") === searchDraft.trim()) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchDraft.trim() || undefined, page: 1 }));
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [filters.search, searchDraft]);

  const { data, isPending, isPlaceholderData, isError, refetch } = useWorkshops(filters);
  const workshopIds = useMemo(() => data?.items.map((w) => w.id) ?? [], [data?.items]);
  const surveyQueries = useWorkshopSurveys(workshopIds);
  const surveysMap = useMemo(
    () => surveyByWorkshopId(workshopIds, surveyQueries),
    [workshopIds, surveyQueries]
  );

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.items.filter((workshop) => {
      if (surveyFilter === "all") {
        return true;
      }
      const entry = surveysMap.get(workshop.id);
      // Keep row visible while survey status is still loading for this workshop.
      if (!entry || entry.isPending) {
        return true;
      }
      if (surveyFilter === "none") {
        return entry.survey === null;
      }
      return entry.survey?.status === surveyFilter;
    });
  }, [data, surveyFilter, surveysMap]);

  const surveysLoading = surveyQueries.some((q) => q.isPending);
  const totalPages = data ? totalPagesOf(data.totalCount, data.pageSize) : 1;
  const hasFilters = Boolean(filters.search || surveyFilter !== "all" || filters.page > 1);

  const openWizard = useCallback(
    (workshopId: string) => router.push(`/workshops/${workshopId}/survey` as Route),
    [router]
  );

  const incompleteOnPage = rows.filter((w) => surveysMap.get(w.id)?.survey?.status === "Incomplete")
    .length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t("survey.queueTitle")} description={t("survey.queueSubtitle")} />

      {incompleteOnPage > 0 ? (
        <section
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-4 py-3"
          role="status"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-[#8a5a14]">
            <ClipboardList className="h-4 w-4 shrink-0" />
            {t("survey.incompleteOnPage", { count: incompleteOnPage })}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setSurveyFilter("Incomplete")}
          >
            {t("survey.filterIncomplete")}
          </Button>
        </section>
      ) : null}

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
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="ps-8"
              placeholder={t("survey.searchPlaceholder")}
            />
          </div>
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-48">
          <Label>{t("survey.statusFilter")}</Label>
          <Select
            value={surveyFilter}
            onValueChange={(value) => setSurveyFilter(value as SurveyFilter)}
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
            onClick={() => {
              setSearchDraft("");
              setSurveyFilter("all");
              setFilters({ page: 1 });
            }}
          >
            <X data-icon="inline-start" />
            {t("workshops.clearFilters")}
          </Button>
        ) : null}
      </section>

      {isPending ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg md:h-12" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          <p>{t("common.error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-14 text-center">
          <p className="text-lg font-semibold text-[var(--navy)]">{t("survey.queueEmpty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("survey.queueEmptyHint")}</p>
          <Button asChild variant="secondary" className="mt-1">
            <Link href="/workshops">{t("survey.goToWorkshops")}</Link>
          </Button>
        </div>
      ) : data && rows.length === 0 && surveysLoading && surveyFilter !== "all" ? (
        <div className="flex flex-col gap-2" aria-busy>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg md:h-12" />
          ))}
        </div>
      ) : data && rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-14 text-center">
          <p className="text-lg font-semibold text-[var(--navy)]">{t("survey.filterEmpty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("survey.filterEmptyHint")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSurveyFilter("all")}
          >
            {t("survey.clearStatusFilter")}
          </Button>
        </div>
      ) : data ? (
        <>
          <div className={cn((isPlaceholderData || surveysLoading) && "opacity-60")}>
            <SurveyQueue rows={rows} surveysMap={surveysMap} openWizard={openWizard} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              {t("survey.queueCount", { count: data.totalCount })}
              {" · "}
              {t("workshops.pageOf", { page: data.page, total: totalPages })}
              {surveyFilter !== "all" ? (
                <span className="ms-1 text-xs">({t("survey.filterPageNote")})</span>
              ) : null}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.page <= 1 || isPlaceholderData}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                {t("workshops.prevPage")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={filters.page >= totalPages || isPlaceholderData}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                {t("workshops.nextPage")}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
