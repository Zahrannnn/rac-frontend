"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useI18n, useT } from "@/shared/i18n";
import type { StatusCount, WorkshopStatus } from "../types";
import { statusCountMap, WORKSHOP_STATUSES } from "../utils/dashboard-filters";
import { CHART_BLUE, CHART_MUTED, CHART_ORANGE, CHART_TICK } from "../constants/chart-theme";

type LifecycleStepperProps = {
  byStatus: StatusCount[];
  activeStatus?: WorkshopStatus | "all";
  onSelectStatus?: (status: WorkshopStatus | "all") => void;
};

type StageRow = {
  status: WorkshopStatus;
  label: string;
  count: number;
};

export function LifecycleStepper({
  byStatus,
  activeStatus = "all",
  onSelectStatus,
}: LifecycleStepperProps) {
  const t = useT();
  const { dir } = useI18n();
  const counts = statusCountMap(byStatus);

  const data = useMemo((): StageRow[] => {
    return WORKSHOP_STATUSES.map((status) => ({
      status,
      label: t(`status.${status}`),
      count: counts[status],
    }));
  }, [counts, t]);

  return (
    <section className="flex h-full flex-col rounded-lg border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-[var(--navy)]">{t("dashboard.lifecycle")}</h2>
      <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.lifecycleHint")}</p>

      <div className="mt-4 min-h-[260px] flex-1 w-full" dir={dir}>
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} stroke={CHART_MUTED} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: CHART_TICK, fontSize: 11 }}
              axisLine={{ stroke: CHART_MUTED }}
              tickLine={false}
              interval={0}
              angle={dir === "rtl" ? 0 : -20}
              textAnchor={dir === "rtl" ? "middle" : "end"}
              height={56}
              reversed={dir === "rtl"}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: CHART_TICK, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
              orientation={dir === "rtl" ? "right" : "left"}
            />
            <Tooltip
              cursor={{ fill: "color-mix(in oklab, var(--brand-blue) 8%, transparent)" }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 12,
              }}
              formatter={(value: number) => [value.toLocaleString("en-US"), t("common.count")]}
            />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
              cursor="pointer"
              onClick={(item) => {
                const status = (item as StageRow | undefined)?.status;
                if (!status || !onSelectStatus) {
                  return;
                }
                onSelectStatus(activeStatus === status ? "all" : status);
              }}
            >
              {data.map((entry) => {
                const isActive = activeStatus === entry.status;
                return (
                  <Cell
                    key={entry.status}
                    fill={isActive ? CHART_ORANGE : CHART_BLUE}
                    opacity={activeStatus !== "all" && !isActive ? 0.45 : 1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{t("dashboard.lifecycleFilterHint")}</p>
    </section>
  );
}
