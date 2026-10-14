"use client";

import { Download, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT, type TranslationKey } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { ReportDefinition } from "../types";
import { REPORT_SUPPORTED_FILTERS } from "../types";
import { useReportMeta, type ReportCategory } from "../utils/report-meta";

export const CATEGORY_LABEL: Record<ReportCategory, TranslationKey> = {
  workshops: "reports.category.workshops",
  people: "reports.category.people",
  monitoring: "reports.category.monitoring",
  compliance: "reports.category.compliance",
};

export function CatalogCard({
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
