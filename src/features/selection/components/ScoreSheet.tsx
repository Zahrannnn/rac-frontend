"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import { useSaveWorkshopScore, useWeights, useWorkshopScore } from "../hooks/use-selection";
import { CRITERIA, weightedContribution } from "../utils/criteria";

/**
 * Per-workshop score breakdown (GET /workshops/{id}/score) with each criterion's
 * weighted contribution computed from the live weights (Σ = TotalWeighted).
 */
/** Entry form state: one 0-100 input per criterion + notes. */
function ScoreEntryForm({
  workshopId,
  onSaved,
}: {
  workshopId: string;
  onSaved: () => void;
}) {
  const t = useT();
  const save = useSaveWorkshopScore(workshopId);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (save.isSuccess) {
      toast.success(t("selection.scoreSaved"));
      onSaved();
    }
  }, [save.isSuccess, onSaved, t]);

  const parsed = CRITERIA.map((criterion) => ({
    ...criterion,
    value: Number(values[criterion.key] ?? ""),
  }));
  const allValid = parsed.every(
    (criterion) => Number.isFinite(criterion.value) && criterion.value >= 0 && criterion.value <= 100
  );

  function submit() {
    if (!allValid || save.isPending) {
      return;
    }

    const payload = Object.fromEntries(parsed.map((criterion) => [criterion.field, criterion.value]));
    save.mutate(
      { ...payload, notes: notes.trim() || null } as Parameters<typeof save.mutate>[0],
      {
        onError: (error) => {
          const detail = (error as { message?: string }).message;
          // 409 = survey not Complete yet — show the server's rule, not a generic error.
          toast.error(detail ?? `${t("common.error")} — ${t("common.retry")}`);
        },
      }
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {CRITERIA.map((criterion) => (
        <div key={criterion.key} className="flex items-center justify-between gap-3">
          <Label htmlFor={`score-${criterion.key}`} className="text-sm font-normal">
            {t(criterion.labelKey)}
          </Label>
          <Input
            id={`score-${criterion.key}`}
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            required
            className="h-9 w-24 text-end tabular-nums"
            value={values[criterion.key] ?? ""}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, [criterion.key]: event.target.value }))
            }
          />
        </div>
      ))}

      <div>
        <Label htmlFor="score-notes" className="text-sm font-normal">
          {t("selection.notes")}
        </Label>
        <Input
          id="score-notes"
          className="mt-1"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      <Button type="button" disabled={!allValid || save.isPending} onClick={submit}>
        {t("profile.save")}
      </Button>
    </div>
  );
}

export function ScoreSheet({
  workshopId,
  workshopLabel,
  onOpenChange,
}: {
  workshopId: string | null;
  /** Code — name of the workshop, for the entry-mode title when no score exists yet. */
  workshopLabel?: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const enabled = Boolean(workshopId);
  const { data: weights } = useWeights();
  const { data: score, isPending, isError } = useWorkshopScore(workshopId ?? "", enabled);
  const canScore = Boolean(user && can(user.permissions, "selection:score"));

  const weightFor = (key: string) =>
    weights?.weights.find((weight) => weight.criterionKey === key)?.weightPercent ?? 0;

  return (
    <Dialog open={enabled} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div>
          <DialogTitle>
            {score
              ? `${score.workshopCode} — ${score.workshopName}`
              : workshopLabel ?? t("selection.scoreEnterTitle")}
          </DialogTitle>
          <DialogDescription>{t("selection.scoreTitle")}</DialogDescription>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-2" aria-busy>
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : isError || !score ? (
          canScore && workshopId ? (
            <ScoreEntryForm workshopId={workshopId} onSaved={() => onOpenChange(false)} />
          ) : (
            <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
              {t("selection.noScore")}
            </p>
          )
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.criterion")}
                    </TableHead>
                    <TableHead className="h-10 w-20 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.rawScore")}
                    </TableHead>
                    <TableHead className="h-10 w-20 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.weight")}
                    </TableHead>
                    <TableHead className="h-10 w-28 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                      {t("selection.contribution")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CRITERIA.map((criterion) => {
                    const raw = score[criterion.field];
                    const weight = weightFor(criterion.key);
                    return (
                      <TableRow key={criterion.key} className="h-11">
                        <TableCell className="font-medium">{t(criterion.labelKey)}</TableCell>
                        <TableCell className="tabular-nums">{raw}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {weight}%
                        </TableCell>
                        <TableCell className="tabular-nums font-semibold text-[var(--navy)]">
                          {weightedContribution(raw, weight).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-baseline justify-between gap-3 rounded-md bg-muted p-3">
              <span className="text-sm font-semibold">{t("selection.totalWeighted")}</span>
              <span className="text-xl font-bold tabular-nums text-primary">
                {score.totalWeighted.toFixed(2)}
              </span>
            </div>

            {score.notes ? (
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {t("selection.notes")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{score.notes}</p>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {t("selection.updatedAt", { date: score.updatedAtUtc.slice(0, 10) })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
