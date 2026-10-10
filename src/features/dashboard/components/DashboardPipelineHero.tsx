"use client";

import Link from "next/link";
import type { Route } from "next";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { StatusCount, WorkshopStatus } from "../types";
import { statusCountMap, WORKSHOP_STATUSES } from "../utils/dashboard-filters";

type PipelineStat = {
  labelKey: TranslationKey;
  value: number;
  /** Rendered straight after the value, e.g. “6” + “%”. */
  suffix?: string;
  /** Muted sub-line under the label, e.g. “Last 30 days”. */
  hintKey?: TranslationKey;
};

type DashboardPipelineHeroProps = {
  totalWorkshops: number;
  byStatus: StatusCount[];
  activeStatus?: WorkshopStatus | "all";
  onSelectStatus?: (status: WorkshopStatus | "all") => void;
  /** Workshops ranked by the latest participation run, toward the recommended target. */
  ranked: number;
  target: number;
  /** Compact context stats in the header row (role-dependent availability). */
  stats?: PipelineStat[];
  /** Filter context only — empty when the whole program is in view. */
  insight?: string;
  showNextStep?: boolean;
  nextStepHref?: Route;
  nextStepLabelKey?: TranslationKey;
};

/**
 * Program pipeline band: the workshop lifecycle as one readable rail — each
 * stage is a live count and a filter. Replaces the KPI-pulse hero: the
 * program's narrative (registration → selection) leads, and the recommended
 * target rides underneath as the single progress story.
 */
export function DashboardPipelineHero({
  totalWorkshops,
  byStatus,
  activeStatus = "all",
  onSelectStatus,
  ranked,
  target,
  stats = [],
  insight,
  showNextStep = false,
  nextStepHref = "/workshops",
  nextStepLabelKey = "dashboard.nextStepWorkshops",
}: DashboardPipelineHeroProps) {
  const t = useT();
  const { dir } = useI18n();
  const counts = statusCountMap(byStatus);
  const scoredShare =
    target > 0 ? Math.min(100, Math.round((ranked / target) * 100)) : 0;

  return (
    <section className="rounded-lg border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-semibold uppercase text-primary",
              dir === "ltr" ? "tracking-wide" : "tracking-normal"
            )}
          >
            {t("dashboard.pipeline.kicker")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.pipeline.hint")}</p>
        </div>

        {stats.length > 0 ? (
          <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            {stats.map((stat) => (
              <li key={stat.labelKey} className="min-w-[4.5rem]">
                <p className="text-lg font-bold tabular-nums leading-tight text-[var(--navy)]">
                  {stat.value.toLocaleString("en-US")}
                  {stat.suffix ? (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {stat.suffix}
                    </span>
                  ) : null}
                </p>
                <p
                  className={cn(
                    "text-xs font-semibold uppercase text-muted-foreground",
                    dir === "ltr" ? "tracking-wide" : "tracking-normal"
                  )}
                >
                  {t(stat.labelKey)}
                </p>
                {stat.hintKey ? (
                  <p className="text-xs text-muted-foreground">{t(stat.hintKey)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div
        className="mt-6 flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("dashboard.lifecycle")}
      >
        {WORKSHOP_STATUSES.map((status, index) => {
          const isActive = activeStatus === status;
          return (
            <div key={status} className="flex min-w-0 flex-wrap items-center gap-2">
              {index > 0 ? (
                <span
                  className="hidden h-px w-6 bg-border sm:block lg:w-10"
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelectStatus?.(isActive ? "all" : status)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary/10 font-semibold text-[var(--navy)]"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    isActive ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                  aria-hidden
                />
                <span>{t(`status.${status}`)}</span>
                <span className="font-bold tabular-nums text-[var(--navy)]">
                  {counts[status].toLocaleString("en-US")}
                </span>
              </button>
            </div>
          );
        })}

        <p className="ms-auto hidden items-baseline gap-1.5 text-sm lg:flex">
          <span className="text-xs uppercase text-muted-foreground">
            {t("dashboard.totalWorkshops")}
          </span>
          <span className="text-xl font-bold tabular-nums text-[var(--navy)]">
            {totalWorkshops.toLocaleString("en-US")}
          </span>
        </p>
      </div>

      {insight ? (
        <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
          {insight}
        </p>
      ) : null}

      <div className="mt-5 max-w-md">
        <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{t("dashboard.pulse.towardTarget")}</span>
          <span className="font-bold tabular-nums text-primary" dir="ltr">
            {target > 0
              ? `${ranked.toLocaleString("en-US")} / ${target.toLocaleString("en-US")} · `
              : ""}
            {scoredShare}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${scoredShare}%` }}
          />
        </div>
      </div>

      {showNextStep ? (
        <Link
          href={nextStepHref}
          className="mt-5 inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t(nextStepLabelKey)}
        </Link>
      ) : null}
    </section>
  );
}
