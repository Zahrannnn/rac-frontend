"use client";

import dynamic from "next/dynamic";
import { useT } from "@/shared/i18n";
import { WidgetErrorBoundary } from "@/shared/components/error-boundary";
import type { LocationMapProps } from "./location-map";

// Leaflet touches window at import time — never render on the server.
const LocationMap = dynamic(() => import("./location-map"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse rounded-lg bg-muted" style={{ height: 280 }} />,
});

/**
 * Client-only map entry point. Renders the loading skeleton during SSR and
 * hydration, then the Leaflet map entirely in the browser. Crashes are
 * isolated per widget (e.g. a browser extension mangling the map DOM) so the
 * surrounding page keeps working.
 */
export function LocationMapLazy(props: LocationMapProps) {
  const t = useT();

  return (
    <WidgetErrorBoundary
      fallback={
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted p-6 text-center"
          style={{ height: props.height ?? 280 }}
        >
          <p className="text-sm font-medium">{t("map.unavailable")}</p>
          <p className="text-xs text-muted-foreground">{t("map.unavailableHint")}</p>
        </div>
      }
    >
      <LocationMap {...props} />
    </WidgetErrorBoundary>
  );
}
