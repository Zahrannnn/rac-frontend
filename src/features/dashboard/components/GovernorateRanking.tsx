"use client";

import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GOVERNORATE_AR } from "@/shared/constants/egypt";
import { useI18n, useT } from "@/shared/i18n";
import type { GovernorateCount } from "../types";
import {
  CHART_BLUE_SCALE,
  CHART_MUTED,
  CHART_ORANGE,
} from "../constants/chart-theme";

const TOP_N = 6;
const OTHERS_KEY = "__others__";

function labelGovernorate(name: string, locale: string): string {
  if (locale !== "ar") {
    return name;
  }
  return GOVERNORATE_AR[name as keyof typeof GOVERNORATE_AR] ?? name;
}

type SliceRow = {
  key: string;
  label: string;
  count: number;
  /** Real governorate id, or null for the rolled-up “Others” slice. */
  governorate: string | null;
};

type GovernorateRankingProps = {
  byGovernorate: GovernorateCount[];
  selected?: string | "all";
  onSelect?: (governorate: string | "all") => void;
  unavailable?: boolean;
};

export function GovernorateRanking({
  byGovernorate,
  selected = "all",
  onSelect,
  unavailable = false,
}: GovernorateRankingProps) {
  const t = useT();
  const { locale } = useI18n();

  const ranked = useMemo(() => {
    return [...byGovernorate].sort(
      (a, b) => b.count - a.count || a.governorate.localeCompare(b.governorate)
    );
  }, [byGovernorate]);

  const slices = useMemo((): SliceRow[] => {
    if (ranked.length === 0) {
      return [];
    }

    const head = ranked.slice(0, TOP_N);
    const tail = ranked.slice(TOP_N);
    const rows: SliceRow[] = head.map((entry) => ({
      key: entry.governorate,
      label: labelGovernorate(entry.governorate, locale),
      count: entry.count,
      governorate: entry.governorate,
    }));

    if (tail.length > 0) {
      rows.push({
        key: OTHERS_KEY,
        label: t("dashboard.rankingOthers"),
        count: tail.reduce((sum, entry) => sum + entry.count, 0),
        governorate: null,
      });
    }

    return rows;
  }, [ranked, locale, t]);

  const total = ranked.reduce((sum, entry) => sum + entry.count, 0);

  function sliceFill(row: SliceRow, index: number): string {
    if (row.governorate && selected === row.governorate) {
      return CHART_ORANGE;
    }
    if (index === 0 && selected === "all") {
      return CHART_ORANGE;
    }
    if (row.key === OTHERS_KEY) {
      return CHART_MUTED;
    }
    return CHART_BLUE_SCALE[index % CHART_BLUE_SCALE.length] ?? CHART_BLUE_SCALE[0];
  }

  function handleSelect(row: SliceRow) {
    if (!onSelect || !row.governorate) {
      return;
    }
    onSelect(selected === row.governorate ? "all" : row.governorate);
  }

  return (
    <section className="flex h-full flex-col rounded-lg border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--navy)]">{t("dashboard.rankingTitle")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.rankingHint")}</p>
        </div>
        {!unavailable && total > 0 ? (
          <p className="text-xs tabular-nums text-muted-foreground">
            {t("dashboard.rankingTotal", { count: total })}
          </p>
        ) : null}
      </div>

      {unavailable ? (
        <p className="mt-8 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
          {t("dashboard.rankingAssignedOnly")}
        </p>
      ) : slices.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("dashboard.rankingEmpty")}</p>
      ) : (
        <div className="mt-4 grid flex-1 grid-cols-1 items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,0.85fr)]">
          <div className="relative mx-auto h-[240px] w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [
                    value.toLocaleString("en-US"),
                    t("common.count"),
                  ]}
                />
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                  cursor="pointer"
                  onClick={(_, index) => {
                    const row = slices[index];
                    if (row) {
                      handleSelect(row);
                    }
                  }}
                >
                  {slices.map((row, index) => (
                    <Cell
                      key={row.key}
                      fill={sliceFill(row, index)}
                      opacity={
                        selected !== "all" && row.governorate !== selected ? 0.4 : 1
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold tabular-nums text-[var(--navy)]">
                {total.toLocaleString("en-US")}
              </p>
              <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground">
                {t("dashboard.rankingCenterLabel")}
              </p>
            </div>
          </div>

          <ul className="flex max-h-[260px] flex-col gap-1 overflow-y-auto pe-1">
            {slices.map((row, index) => {
              const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
              const isSelected = row.governorate !== null && selected === row.governorate;
              const clickable = row.governorate !== null;

              return (
                <li key={row.key}>
                  <button
                    type="button"
                    disabled={!clickable}
                    onClick={() => handleSelect(row)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      clickable ? "hover:bg-muted/60 cursor-pointer" : "cursor-default opacity-90"
                    } ${isSelected ? "bg-[var(--row-selected)]" : ""}`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ background: sliceFill(row, index) }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{row.label}</span>
                    <span className="shrink-0 tabular-nums text-[var(--navy)] font-semibold">
                      {row.count.toLocaleString("en-US")}
                    </span>
                    <span className="w-8 shrink-0 text-end text-xs tabular-nums text-muted-foreground">
                      {share}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
