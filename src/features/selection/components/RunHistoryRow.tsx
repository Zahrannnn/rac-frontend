"use client";

import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n, useT } from "@/shared/i18n";
import { selectionRun } from "@/shared/constants/routes";
import type { SelectionRunSummary } from "../types";
import { formatUtc } from "../utils/datetime";
import { RunKindChip } from "./RunKindChip";

/** One compact history row: chip, date, run by, counts, rubric version, actions. */
export function RunHistoryRow({
  run,
  onExport,
  exportPending,
}: {
  run: SelectionRunSummary;
  onExport: (runId: string) => void;
  exportPending: boolean;
}) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <RunKindChip kind={run.kind} />
      <span className="text-sm font-medium text-[var(--navy)]">
        {formatUtc(run.runAtUtc, locale)}
      </span>
      <span className="text-xs text-muted-foreground">
        {t("selection.runs.by", { name: run.runByUsername ?? "—" })}
        {run.notes ? ` · ${run.notes}` : ""}
      </span>
      <span className="ms-auto text-xs tabular-nums text-muted-foreground">
        {t("selection.runs.counts", {
          ranked: run.rankedCount,
          recommended: run.recommendedCount,
          reserve: run.reserveCount,
        })}
      </span>
      <span className="font-mono text-[0.6875rem] text-muted-foreground" dir="ltr">
        {run.rubricVersion}
      </span>
      <span className="flex items-center gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={selectionRun(run.id)}>
            <Eye className="h-4 w-4" aria-hidden />
            <span className="sr-only">{t("selection.runs.viewList")}</span>
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={exportPending}
          onClick={() => onExport(run.id)}
        >
          <Download className="h-4 w-4" aria-hidden />
          <span className="sr-only">{t("selection.runs.export")}</span>
        </Button>
      </span>
    </div>
  );
}
