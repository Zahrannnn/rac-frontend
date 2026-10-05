"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { governorateLabel } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import { fetchTrainings } from "@/features/trainings";
import { computeTrainingStats } from "../utils/training-stats";
import { dashboardKeys } from "../utils/query-keys";

/** Dedicated training-statistics panel — computed from the trainings list
 * API (first 100 records; the backend exposes no aggregate endpoint). */
export function TrainingStatsSection() {
  const t = useT();
  const { locale } = useI18n();
  const { data, isPending, isError } = useQuery({
    queryKey: dashboardKeys.trainingStats(),
    queryFn: () => fetchTrainings({ page: 1 }),
  });

  const stats = useMemo(
    () => computeTrainingStats(data?.items ?? [], data?.totalCount ?? 0),
    [data]
  );

  const kpis = [
    { labelKey: "dashboard.trainingsTotal", value: stats.total },
    { labelKey: "dashboard.trainingsCompleted", value: stats.completed },
    { labelKey: "dashboard.trainingsUpcoming", value: stats.upcoming },
    { labelKey: "dashboard.trainingsAttendees", value: stats.attendees },
    { labelKey: "dashboard.trainingsAvgAttendees", value: stats.avgAttendees },
  ] as const;

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" aria-hidden />
        <h2 className="text-sm font-semibold text-[var(--navy)]">
          {t("dashboard.trainingStats")}
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.trainingStatsHint")}</p>

      {isPending ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5" aria-busy>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-16 rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <p className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {t("common.error")}
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {kpis.map((kpi) => (
              <div key={kpi.labelKey} className="rounded-md border bg-background p-3">
                <p className="text-xl font-bold tabular-nums text-[var(--navy)]">
                  {kpi.value.toLocaleString("en-US")}
                </p>
                <p className="mt-0.5 text-[0.7rem] font-medium text-muted-foreground">
                  {t(kpi.labelKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("dashboard.trainingsByGovernorate")}
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {stats.byGovernorate.length === 0 ? (
                  <li className="text-xs text-muted-foreground">—</li>
                ) : (
                  stats.byGovernorate.map((row) => (
                    <li key={row.governorate} className="flex items-center gap-2 text-xs">
                      <span className="w-28 shrink-0 truncate text-muted-foreground">
                        {governorateLabel(row.governorate, locale)}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{
                            width: `${Math.round(
                              (row.count / Math.max(1, stats.byGovernorate[0].count)) * 100
                            )}%`,
                          }}
                        />
                      </span>
                      <span className="w-6 text-end font-semibold tabular-nums">{row.count}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("dashboard.trainingsMonthly")}
              </h3>
              <div className="mt-2 flex h-24 items-end gap-2" dir="ltr">
                {stats.months.map((month) => (
                  <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[0.65rem] font-semibold tabular-nums text-muted-foreground">
                      {month.count}
                    </span>
                    <span
                      className="w-full rounded-t-sm bg-[var(--secondary)]"
                      style={{ height: `${Math.max(4, (month.count / stats.maxMonth) * 72)}px` }}
                      aria-hidden
                    />
                    <span className="text-[0.6rem] tabular-nums text-muted-foreground" dir="ltr">
                      {month.label.slice(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
