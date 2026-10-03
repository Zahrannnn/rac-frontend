"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useI18n, useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type {
  AssignedDashboardAttention,
  DashboardAttention,
  SurveySummaryBrief,
} from "../types";
import { buildAttentionChips } from "../utils/attention-chips";

const TONE_CLASS = {
  warning:
    "border-[color-mix(in_oklab,var(--warning)_40%,var(--border))] bg-[color-mix(in_oklab,var(--warning)_10%,var(--card))] text-[var(--warning)]",
  danger: "border-destructive/35 bg-destructive/5 text-destructive",
  info: "border-primary/30 bg-primary/5 text-primary",
} as const;

type AttentionStripProps = {
  attention: DashboardAttention | AssignedDashboardAttention;
  /// Survey briefs (full shape) — anchor the failing-survey chip to the wizard review step.
  surveyBriefs?: SurveySummaryBrief[];
  /// Full strip includes stuck drafts + unscored Complete.
  includeOfficeChips?: boolean;
};

/** Compact needs-attention chip row. Hide zeros; empty → calm “all clear”. */
export function AttentionStrip({
  attention,
  surveyBriefs,
  includeOfficeChips,
}: AttentionStripProps) {
  const t = useT();
  const { dir } = useI18n();
  const chips = buildAttentionChips(attention, {
    includeOfficeChips,
    surveyBriefs,
  });

  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t("dashboard.attention.title")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className={cn(
            "text-xs font-semibold uppercase text-[var(--navy)]",
            dir === "ltr" ? "tracking-wide" : "tracking-normal"
          )}
        >
          {t("dashboard.attention.title")}
        </h2>
        {chips.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("dashboard.attention.hint")}
          </p>
        ) : null}
      </div>

      {chips.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-[color-mix(in_oklab,var(--success)_35%,var(--border))] bg-[color-mix(in_oklab,var(--success)_8%,var(--card))] px-3 py-2.5 text-sm text-[var(--success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          <p>{t("dashboard.attention.allClear")}</p>
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <Link
                href={chip.href}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  TONE_CLASS[chip.tone]
                )}
              >
                <span className="tabular-nums font-bold">{chip.count.toLocaleString("en-US")}</span>
                <span>{t(chip.labelKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
