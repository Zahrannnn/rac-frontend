"use client";

import Link from "next/link";
import type { Route } from "next";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";

type DashboardHeroProps = {
  titleKey: TranslationKey;
  value: number;
  insight: string;
  supporting: { labelKey: TranslationKey; value: number }[];
  showNextStep?: boolean;
  nextStepHref?: Route;
  nextStepLabelKey?: TranslationKey;
  progressPercent?: number;
};

export function DashboardHero({
  titleKey,
  value,
  insight,
  supporting,
  showNextStep = false,
  nextStepHref = "/workshops",
  nextStepLabelKey = "dashboard.nextStepWorkshops",
  progressPercent = 0,
}: DashboardHeroProps) {
  const t = useT();
  const { dir } = useI18n();
  const clamped = Math.max(0, Math.min(100, progressPercent));

  return (
    <section className="rounded-lg border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-semibold uppercase text-primary ${
              dir === "ltr" ? "tracking-wide" : "tracking-normal"
            }`}
          >
            {t(titleKey)}
          </p>
          <p className="mt-2 text-4xl font-bold tabular-nums leading-none text-[var(--navy)] sm:text-5xl">
            {value.toLocaleString("en-US")}
          </p>
          <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{insight}</p>

          <div className="mt-5 max-w-sm">
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{t("dashboard.progressLabel")}</span>
              <span className="font-bold tabular-nums text-[var(--secondary)]">{clamped}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
                style={{ width: `${clamped}%` }}
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
        </div>

        {supporting.length > 0 ? (
          <ul className="grid flex-1 grid-cols-2 content-center gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-3 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
            {supporting.map((item) => (
              <li key={item.labelKey} className="min-w-[6.5rem]">
                <p className="text-2xl font-bold tabular-nums text-[var(--navy)]">
                  {item.value.toLocaleString("en-US")}
                </p>
                <p
                  className={`mt-1 text-xs font-semibold uppercase text-muted-foreground ${
                    dir === "ltr" ? "tracking-wide" : "tracking-normal"
                  }`}
                >
                  {t(item.labelKey)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
