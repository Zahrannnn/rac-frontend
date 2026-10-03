"use client";

import dynamic from "next/dynamic";
import type { WorkshopsMapProps } from "./workshops-map";

const WorkshopsMap = dynamic(() => import("./workshops-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] animate-pulse rounded-lg bg-muted" style={{ height: 360 }} />
  ),
});

/** Client-only multi-pin map (Leaflet must not SSR). */
export function WorkshopsMapLazy(props: WorkshopsMapProps) {
  return <WorkshopsMap {...props} />;
}
