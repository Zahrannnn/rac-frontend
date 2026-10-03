"use client";

import { useI18n, useT, type TranslationKey } from "@/shared/i18n";

/**
 * KPI card per DESIGN.md: white card, kpi-number scale for the figure,
 * label-caps caption, Western digits. Drill-down arrives in later weeks.
 */
export function KpiCard({ labelKey, value }: { labelKey: TranslationKey; value: number }) {
  const t = useT();
  const { dir } = useI18n();

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-bold leading-tight tabular-nums">{value.toLocaleString("en-US")}</p>
      <p
        className={`mt-1 text-xs font-semibold uppercase text-muted-foreground ${
          dir === "ltr" ? "tracking-wide" : "tracking-normal"
        }`}
      >
        {t(labelKey)}
      </p>
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}
