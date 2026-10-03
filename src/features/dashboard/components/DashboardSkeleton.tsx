"use client";

import { KpiCardSkeleton } from "./KpiCard";

const SKELETON_KEYS = ["a", "b", "c", "d"] as const;

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <div className="h-24 animate-pulse rounded-lg border bg-muted/60" />
      <div className="h-36 animate-pulse rounded-lg border bg-muted/60" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg border bg-muted/60" />
        <div className="h-80 animate-pulse rounded-lg border bg-muted/60" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SKELETON_KEYS.map((key) => (
          <KpiCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
