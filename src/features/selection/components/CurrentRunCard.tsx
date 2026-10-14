"use client";

import Link from "next/link";
import { Download, ListOrdered, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { selectionRun } from "@/shared/constants/routes";
import { useI18n, useT } from "@/shared/i18n";
import type { RubricKind, SelectionRunSummary } from "../types";
import { formatUtc } from "../utils/datetime";
import { RunKindChip } from "./RunKindChip";

/** One recommendation card's populated body: the latest run snapshot of its kind. */
export function CurrentRunCard({
  run,
  canRun,
  onViewCreate,
  onExport,
  exportPending,
}: {
  run: SelectionRunSummary;
  canRun: boolean;
  onViewCreate: (kind: RubricKind) => void;
  onExport: (runId: string) => void;
  exportPending: boolean;
}) {
  const t = useT();
  const { locale } = useI18n();

  return (
    <Card className="flex flex-col gap-3 p-4">
      <CardTitle>
        {t(
          run.kind === "participation"
            ? "selection.current.participationTitle"
            : "selection.current.equipmentTitle"
        )}
      </CardTitle>

      <div className="flex flex-wrap items-center gap-2">
        <RunKindChip kind={run.kind} />
        <span className="text-sm font-medium text-[var(--navy)]">
          {formatUtc(run.runAtUtc, locale)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("selection.runs.by", { name: run.runByUsername ?? "—" })}
      </p>
      <p className="text-xs tabular-nums text-muted-foreground">
        {t("selection.runs.counts", {
          ranked: run.rankedCount,
          recommended: run.recommendedCount,
          reserve: run.reserveCount,
        })}
      </p>
      <p className="font-mono text-[0.6875rem] text-muted-foreground" dir="ltr">
        {run.rubricVersion}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {/* The card's single primary action — everything below it is outline. */}
        <Button asChild>
          <Link href={selectionRun(run.id)}>
            <ListOrdered data-icon="inline-start" />
            {t("selection.runs.viewList")}
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={exportPending}
          onClick={() => onExport(run.id)}
        >
          <Download data-icon="inline-start" />
          {exportPending ? t("selection.runs.exporting") : t("selection.runs.export")}
        </Button>
        {canRun ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewCreate(run.kind)}
          >
            <Play data-icon="inline-start" />
            {t("selection.runs.newRun")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
