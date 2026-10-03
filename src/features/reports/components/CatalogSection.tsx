"use client";

import { useMemo, useState } from "react";
import { Download, FileBarChart, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, type TranslationKey } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { ReportDefinition } from "../types";
import { REPORT_SUPPORTED_FILTERS } from "../types";
import {
  REPORT_CATEGORIES,
  reportCategory,
  reportSearchBlob,
  useReportMeta,
  type ReportCategory,
} from "../utils/report-meta";

const CATEGORY_LABEL: Record<ReportCategory, TranslationKey> = {
  workshops: "reports.category.workshops",
  people: "reports.category.people",
  monitoring: "reports.category.monitoring",
  compliance: "reports.category.compliance",
};

/** Toggle pill for one catalog category (or the "all" reset). */
function CategoryButton({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-h-9 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
        selected
          ? "border-primary bg-primary/10 text-[var(--accent-foreground)]"
          : "bg-card text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}

function CatalogCard({
  definition,
  onGenerate,
}: {
  definition: ReportDefinition;
  onGenerate: (definition: ReportDefinition) => void;
}) {
  const t = useT();
  const { icon: Icon, title, description, category } = useReportMeta(definition);
  const filterCount = REPORT_SUPPORTED_FILTERS[definition.key]?.length ?? 0;

  return (
    <article
      className={cn(
        "group flex flex-col justify-between gap-4 rounded-lg border bg-card p-4",
        "transition-colors duration-150",
        "hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))] hover:bg-[var(--row-selected)]"
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--navy-shell)]/10 text-[var(--navy)]">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-snug text-[var(--navy)]">{title}</h3>
            {category ? (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {t(CATEGORY_LABEL[category])}
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-semibold text-primary">
            {t("reports.formatXlsx")}
          </span>
          {filterCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">
              <SlidersHorizontal className="h-3 w-3" aria-hidden />
              {t("reports.filterableCount", { count: filterCount })}
            </span>
          ) : (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">
              {t("reports.readyToRun")}
            </span>
          )}
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onGenerate(definition)}
      >
        <Download data-icon="inline-start" />
        {t("reports.generate")}
      </Button>
    </article>
  );
}

/** Report catalog with its search + category filters (GET /reports/catalog). */
export function CatalogSection({
  catalog,
  isPending,
  isError,
  refetch,
  onGenerate,
}: {
  catalog: ReportDefinition[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => void;
  onGenerate: (definition: ReportDefinition) => void;
}) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ReportCategory | "all">("all");

  const filtered = useMemo(() => {
    if (!catalog) return [];
    const needle = query.trim().toLowerCase();
    return catalog.filter((definition) => {
      const cat = reportCategory(definition.key);
      if (category !== "all" && cat !== category) return false;
      if (!needle) return true;
      return reportSearchBlob(definition, t).includes(needle);
    });
  }, [catalog, category, query, t]);

  return (
    <section aria-label={t("reports.catalogTitle")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--navy)]">{t("reports.catalogTitle")}</h2>
          {catalog && catalog.length > 0 ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("reports.catalogCount", {
                shown: filtered.length,
                total: catalog.length,
              })}
            </p>
          ) : null}
        </div>
      </div>

      {!isPending && !isError && catalog && catalog.length > 0 ? (
        <div
          className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end"
          aria-label={t("reports.search")}
        >
          <div className="flex min-w-56 flex-1 flex-col gap-1.5">
            <Label htmlFor="report-search" className="text-primary">
              {t("reports.search")}
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="report-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("reports.searchPlaceholder")}
                className="ps-8"
              />
            </div>
          </div>

          <div
            role="group"
            aria-label={t("reports.categoryLabel")}
            className="flex flex-wrap gap-1.5"
          >
            <CategoryButton
              label={t("reports.category.all")}
              selected={category === "all"}
              onSelect={() => setCategory("all")}
            />
            {REPORT_CATEGORIES.map((item) => (
              <CategoryButton
                key={item}
                label={t(CATEGORY_LABEL[item])}
                selected={category === item}
                onSelect={() => setCategory(item)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          <p>{t("common.error")}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : !catalog || catalog.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-14 text-center">
          <FileBarChart className="h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-lg font-semibold text-[var(--navy)]">{t("reports.catalogEmpty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("reports.catalogEmptyHint")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-12 text-center">
          <Search className="h-7 w-7 text-muted-foreground" aria-hidden />
          <p className="text-base font-semibold text-[var(--navy)]">{t("reports.searchEmpty")}</p>
          <p className="max-w-[40ch] text-sm text-muted-foreground">{t("reports.searchEmptyHint")}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            {t("reports.clearFilters")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((definition) => (
            <CatalogCard
              key={definition.id}
              definition={definition}
              onGenerate={onGenerate}
            />
          ))}
        </div>
      )}
    </section>
  );
}
