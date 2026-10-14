"use client";

import { AlertTriangle, FileSearch } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useI18n, useT } from "@/shared/i18n";
import { QueryErrorState } from "@/shared/components/query-states";
import { useScorecard } from "../hooks/use-selection";
import type { RubricKind, ScorecardCriterion } from "../types";
import { formatUtc } from "../utils/datetime";
import { bandLabel, criterionLabel } from "../utils/rubric";

/**
 * The traceability view (ADR-0004): one workshop's live machine-scored rubric.
 * Per criterion it shows the raw survey answer, the matched band, and the points —
 * every score traces to the database. A 409 (workshop not scorable for the kind)
 * renders as an explanatory empty state, never an error toast.
 */
export function ScorecardDialog({
  workshopId,
  kind,
  workshopLabel,
  onOpenChange,
}: {
  workshopId: string | null;
  kind: RubricKind;
  /** Code — name of the workshop, when the caller knows it. */
  workshopLabel?: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const { data, isPending, isError, error, refetch } = useScorecard(workshopId, kind);

  const status = (error as { status?: number } | null)?.status;
  const notScorable = isError && status === 409;
  const notFound = isError && status === 404;

  // Rubric order is the traceability contract (ADR-0004) — no sorting.
  const columns: DataTableColumn<ScorecardCriterion>[] = [
    {
      key: "criterion",
      header: t("selection.scorecard.criterion"),
      className: "font-medium",
      cell: (criterion) => t(criterionLabel(criterion.labelKey)),
    },
    {
      key: "rawAnswer",
      header: t("selection.scorecard.rawAnswer"),
      className: "max-w-[12rem]",
      cell: (criterion) =>
        criterion.source.displayValue ? (
          <code
            dir="ltr"
            className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
          >
            {criterion.source.displayValue}
          </code>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "band",
      header: t("selection.scorecard.band"),
      className: "text-sm",
      cell: (criterion) => t(bandLabel(criterion.bandLabelKey)),
    },
    {
      key: "points",
      header: t("selection.scorecard.points"),
      headerClassName: "w-24",
      className: "tabular-nums font-semibold text-[var(--navy)]",
      cell: (criterion) => (
        <span dir="ltr">
          {criterion.points} / {criterion.maxPoints}
        </span>
      ),
    },
  ];

  return (
    <Dialog open={Boolean(workshopId)} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>
            {workshopLabel ?? t("selection.scorecard.title")}
          </DialogTitle>
          <DialogDescription className={workshopLabel ? undefined : "sr-only"}>
            {t("selection.scorecard.title")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="gap-4">
          {kind === "equipment" ? (
            <p className="flex items-start gap-2 rounded-md bg-[var(--warning)]/15 p-3 text-sm font-medium text-[#8a5a14] dark:text-[var(--warning)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t("selection.scorecard.needInvertedHint")}
            </p>
          ) : null}

          {isPending ? (
            <div className="flex flex-col gap-2" aria-busy>
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : notScorable || notFound ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-card px-6 py-12 text-center">
              <FileSearch className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="max-w-[46ch] text-sm text-muted-foreground">
                {t(
                  kind === "equipment"
                    ? "selection.scorecard.equipmentNotScorable"
                    : "selection.scorecard.participationNotScorable"
                )}
              </p>
            </div>
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : data ? (
            <DataTable
              columns={columns}
              data={data.criteria}
              getRowId={(criterion) => criterion.key}
              ariaLabel={t("selection.scorecard.title")}
              density="compact"
            />
          ) : null}
        </DialogBody>

        {data && !isPending && !isError ? (
          <DialogFooter className="justify-between gap-x-6 gap-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-mono" dir="ltr">
                {data.rubricVersion}
              </span>
              {" · "}
              {t("selection.scorecard.computedAt", { date: formatUtc(data.computedAtUtc, locale) })}
            </p>
            <p className="flex items-baseline gap-3">
              <span className="text-sm font-semibold">{t("selection.scorecard.total")}</span>
              <span className="text-xl font-bold tabular-nums text-primary" dir="ltr">
                {data.total} / {data.maxTotal}
              </span>
            </p>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
