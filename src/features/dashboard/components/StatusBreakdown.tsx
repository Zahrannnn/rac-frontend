"use client";

import { useT } from "@/shared/i18n";
import type { StatusCount } from "../types";

export function StatusBreakdown({ byStatus }: { byStatus: StatusCount[] }) {
  const t = useT();

  if (byStatus.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-sm font-semibold text-muted-foreground">{t("dashboard.byStatus")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {byStatus.map((entry) => (
          <span
            key={entry.status}
            className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
          >
            <span>{t(`status.${entry.status}` as const)}</span>
            <span className="tabular-nums font-semibold">{entry.count.toLocaleString("en-US")}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
