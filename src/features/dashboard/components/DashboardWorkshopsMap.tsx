"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkshopsMapLazy } from "@/shared/components/map";
import { useI18n, useT } from "@/shared/i18n";
import { useDashboardMap } from "../hooks/use-dashboard-map";
import { filterMapPoints } from "../utils/dashboard-map-filters";
import type { WorkshopStatus } from "../types";
import type { DashboardFilterState } from "../utils/dashboard-filters";

export function DashboardWorkshopsMap({
  filters,
}: {
  filters: DashboardFilterState;
}) {
  const t = useT();
  const { locale } = useI18n();
  // Server already filters map pins; keep a client pass for assigned local status toggles.
  const { data, isPending, isError, refetch, isFetching } = useDashboardMap(filters);

  const visible = useMemo(
    () => filterMapPoints(data?.points ?? [], filters),
    [data?.points, filters]
  );

  const markers = useMemo(
    () =>
      visible.map((point) => {
        const title =
          locale === "ar" && point.nameAr ? point.nameAr : point.nameEn || point.nameAr || point.code;
        const subtitleParts = [
          point.code,
          point.district ?? null,
          t(`status.${point.status as WorkshopStatus}`),
        ].filter(Boolean);
        return {
          id: point.workshopId,
          lat: point.latitude,
          lon: point.longitude,
          title,
          subtitle: subtitleParts.join(" · "),
          href: `/workshops/${point.workshopId}`,
          linkLabel: t("dashboard.mapOpenWorkshop"),
        };
      }),
    [visible, locale, t]
  );

  const totalWithGps = data?.points.length ?? 0;

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--navy)]">{t("dashboard.mapTitle")}</h2>
        {!isPending && !isError ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("dashboard.mapCount", {
              shown: visible.length,
              total: totalWithGps,
            })}
          </p>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("dashboard.mapHint")}</p>

      {isPending ? (
        <Skeleton className="mt-3 h-[360px] w-full rounded-lg" />
      ) : isError ? (
        <div className="mt-3 flex flex-col items-start gap-3 rounded-md bg-muted p-4">
          <p className="text-sm text-destructive">{t("dashboard.mapError")}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            {t("common.retry")}
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-md bg-muted p-8 text-center">
          <MapPin className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">{t("dashboard.mapEmpty")}</p>
          <p className="text-xs text-muted-foreground">{t("dashboard.mapEmptyHint")}</p>
        </div>
      ) : (
        <div className="mt-3">
          <WorkshopsMapLazy markers={markers} height={360} />
        </div>
      )}
    </section>
  );
}
