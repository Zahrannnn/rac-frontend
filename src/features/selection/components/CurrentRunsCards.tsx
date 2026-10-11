"use client";

import Link from "next/link";
import { Download, ListOrdered, Play, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { saveBlob } from "@/shared/api/file-transfer";
import { selectionRun } from "@/shared/constants/routes";
import { useI18n, useT } from "@/shared/i18n";
import { can, useAuth } from "@/features/auth";
import { QueryErrorState } from "@/shared/components/query-states";
import { useExportSelectionRun, useSelectionRuns } from "../hooks/use-selection";
import type { RubricKind, SelectionRunSummary } from "../types";
import { formatUtc } from "../utils/datetime";
import { RunKindChip } from "./RunKindChip";

/** One recommendation card's populated body: the latest run snapshot of its kind. */
function CurrentRunCard({
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

/** One recommendation card's empty body: what the missing kind would do + the create CTA. */
function EmptyRunCard({
  kind,
  canRun,
  canCreate,
  onViewCreate,
}: {
  kind: RubricKind;
  canRun: boolean;
  canCreate: boolean;
  onViewCreate: (kind: RubricKind) => void;
}) {
  const t = useT();
  const titleKey =
    kind === "participation"
      ? "selection.current.participationTitle"
      : "selection.current.equipmentTitle";
  const messageKey =
    kind === "participation"
      ? "selection.current.participationEmpty"
      : "selection.current.equipmentEmpty";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <CardTitle>{t(titleKey)}</CardTitle>
      <p className="text-sm leading-6 text-muted-foreground">{t(messageKey)}</p>

      {canRun ? (
        <>
          <div className="mt-auto pt-1">
            {kind === "participation" ? (
              <Button type="button" onClick={() => onViewCreate(kind)}>
                <Play data-icon="inline-start" />
                {t("selection.runs.createParticipation")}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!canCreate}
                onClick={() => onViewCreate(kind)}
              >
                <Wrench data-icon="inline-start" />
                {t("selection.runs.createEquipment")}
              </Button>
            )}
          </div>
          {!canCreate && kind === "equipment" ? (
            <p className="text-xs text-muted-foreground">
              {t("selection.runs.equipmentNeedsParticipationHint")}
            </p>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

/**
 * The two "current recommendation" cards (Screen 05): the latest participation run
 * and the latest equipment run, derived from the same runs query page 1 the history
 * reads (the latest of each kind is always on the newest-first first page). Each
 * card carries exactly one primary action — "View the list" when populated, the
 * create CTA when empty; the equipment CTA stays disabled until a participation
 * run exists, matching the backend's 409 gating.
 */
export function CurrentRunsCards({
  onRequestCreate,
}: {
  onRequestCreate: (kind: RubricKind) => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const canRun = Boolean(user && can(user.permissions, "selection:run"));

  const { data, isPending, isError, refetch } = useSelectionRuns(1);
  const exportRun = useExportSelectionRun();

  if (isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2" aria-busy>
        {(["participation", "equipment"] as const).map((kind) => (
          <Card key={kind} className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-9 w-full max-w-64" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-4">
        <QueryErrorState onRetry={() => void refetch()} />
      </Card>
    );
  }

  const latestOf = (kind: RubricKind) =>
    data.items.find((run) => run.kind === kind) ?? null;
  const hasParticipationRun = data.items.some((run) => run.kind === "participation");

  const download = (runId: string) => {
    exportRun.mutate(runId, {
      onSuccess: ({ blob, fileName }) => {
        saveBlob(blob, fileName);
        toast.success(t("selection.runs.exported"));
      },
      onError: () => toast.error(t("selection.runs.exportFailed")),
    });
  };

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2">
      {(["participation", "equipment"] as const).map((kind) => {
        const run = latestOf(kind);
        return run ? (
          <CurrentRunCard
            key={kind}
            run={run}
            canRun={canRun}
            onViewCreate={onRequestCreate}
            onExport={download}
            exportPending={exportRun.isPending}
          />
        ) : (
          <EmptyRunCard
            key={kind}
            kind={kind}
            canRun={canRun}
            canCreate={hasParticipationRun}
            onViewCreate={onRequestCreate}
          />
        );
      })}
    </div>
  );
}
