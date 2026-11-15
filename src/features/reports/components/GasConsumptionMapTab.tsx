"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n, useT } from "@/shared/i18n";
import { useGasConsumption } from "../hooks/use-reports";
import type { GasConsumptionRow } from "../types";
import {
  GAS_CONSUMPTION_BANDS,
  gasBandColor,
  gasBandIndex,
  formatGasKg,
  gasDesignation,
  gasRowName,
} from "../utils/gas-consumption";

/** Client-only leaflet map (Leaflet must not SSR — WorkshopsMapLazy pattern). */
const GasConsumptionMap = dynamic(() => import("./GasConsumptionMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[460px] w-full rounded-lg" />,
});

/** Side-list entry shared by located and unlocated workshops. */
function ConsumptionListItem({ row }: { row: GasConsumptionRow }) {
  const t = useT();
  const { locale } = useI18n();
  const band = gasBandIndex(row.annualTotalKg);

  return (
    <li className="flex items-start gap-3 rounded-md border bg-card px-3 py-2.5">
      <span
        aria-hidden
        className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-sm"
        style={{ backgroundColor: gasBandColor(band) }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate text-sm font-semibold text-[var(--navy)]">
            {gasRowName(row, locale)}
          </span>
          <span className="font-mono text-xs text-muted-foreground" dir="ltr">
            {row.code}
          </span>
          {row.latitude == null || row.longitude == null ? (
            <span className="rounded border border-dashed border-muted-foreground/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {t("reports.mapNoCoordinates")}
            </span>
          ) : null}
        </div>
        {row.governorate ? (
          <span className="text-xs text-muted-foreground">{row.governorate}</span>
        ) : null}
        <span className="text-sm font-bold tabular-nums text-[var(--navy)]">
          {formatGasKg(row.annualTotalKg)}{" "}
          <span className="text-xs font-medium text-muted-foreground">
            {t("reports.mapUnit")}
          </span>
        </span>
        {/* §11 corrections: the same organized per-gas rows as the popup — aligned
            designation/quantity pairs instead of the comma blob. */}
        {row.perGas.length > 0 ? (
          <ul className="mt-1 space-y-0.5 border-t pt-1">
            {row.perGas.map((gas) => (
              <li key={gas.gas} className="flex items-baseline justify-between gap-4 text-xs">
                <span className="text-muted-foreground">{gasDesignation(gas.gas, t)}</span>
                <span className="font-medium tabular-nums text-[var(--navy)]">
                  {formatGasKg(gas.quantityKg)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

/**
 * The annual gas consumption map tab (REGISTRY-GAS-SPEC §6): fetches the §5
 * endpoint, renders a client-only map with workshop pins (bands by annualTotalKg)
 * plus a side list sorted by annualTotalKg descending; workshops without
 * coordinates appear only in the side list flagged "بدون إحداثيات".
 */
export function GasConsumptionMapTab() {
  const t = useT();
  const { locale } = useI18n();
  const { data: rows, isPending, isError, refetch } = useGasConsumption();

  // The endpoint already sorts by annualTotalKg desc; sort defensively so the
  // side list contract holds regardless of the wire order.
  const sorted = useMemo(
    () => [...(rows ?? [])].sort((a, b) => b.annualTotalKg - a.annualTotalKg),
    [rows]
  );
  const located = useMemo(
    () => sorted.filter((row) => row.latitude != null && row.longitude != null),
    [sorted]
  );

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-[460px] w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("reports.mapError")}</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          <RefreshCcw data-icon="inline-start" />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 py-16 text-center text-sm text-muted-foreground">
        {t("reports.mapEmpty")}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <GasConsumptionMap rows={located} />

      <div className="flex min-w-0 flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--navy)]">
          {t("reports.mapSideListTitle")}
        </h3>
        <ul
          className="flex max-h-[380px] flex-col gap-2 overflow-y-auto pe-1"
          aria-label={t("reports.mapSideListTitle")}
        >
          {sorted.map((row) => (
            <ConsumptionListItem key={row.workshopId} row={row} />
          ))}
        </ul>
        <div className="rounded-md border bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("reports.mapLegend")}
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {GAS_CONSUMPTION_BANDS.map((band, index) => (
              <li key={band.label} className="flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full border border-white"
                  style={{ backgroundColor: gasBandColor(index) }}
                />
                <span className="tabular-nums text-muted-foreground">{band.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
