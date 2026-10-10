"use client";

import { AlertTriangle, FileSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n, useT } from "@/shared/i18n";
import { QueryErrorState } from "@/shared/components/query-states";
import { useScorecard } from "../hooks/use-selection";
import type { RubricKind } from "../types";
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

  return (
    <Dialog open={Boolean(workshopId)} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-4 overflow-hidden sm:max-w-2xl">
        <div className="flex flex-col gap-1">
          <DialogTitle>
            {workshopLabel ?? t("selection.scorecard.title")}
          </DialogTitle>
          <DialogDescription>{t("selection.scorecard.title")}</DialogDescription>
        </div>

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
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.scorecard.criterion")}
                    </TableHead>
                    <TableHead className="h-10 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.scorecard.rawAnswer")}
                    </TableHead>
                    <TableHead className="h-10 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.scorecard.band")}
                    </TableHead>
                    <TableHead className="h-10 w-24 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.scorecard.points")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.criteria.map((criterion) => (
                    <TableRow key={criterion.key} className="h-12">
                      <TableCell className="font-medium">
                        {t(criterionLabel(criterion.labelKey))}
                      </TableCell>
                      <TableCell className="max-w-[12rem]">
                        {criterion.source.displayValue ? (
                          <code
                            dir="ltr"
                            className="block truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
                          >
                            {criterion.source.displayValue}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t(bandLabel(criterion.bandLabelKey))}
                      </TableCell>
                      <TableCell className="tabular-nums font-semibold text-[var(--navy)]" dir="ltr">
                        {criterion.points} / {criterion.maxPoints}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-muted p-3">
              <span className="text-sm font-semibold">{t("selection.scorecard.total")}</span>
              <span className="text-xl font-bold tabular-nums text-primary" dir="ltr">
                {data.total} / {data.maxTotal}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="font-mono" dir="ltr">
                {data.rubricVersion}
              </span>
              {" · "}
              {t("selection.scorecard.computedAt", { date: formatUtc(data.computedAtUtc, locale) })}
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
