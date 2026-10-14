"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { can, useAuth } from "@/features/auth";
import { QueryErrorState } from "@/shared/components/query-states";
import { useSelectionRuns } from "../hooks/use-selection";
import { useSelectionRunExport } from "../hooks/use-selection-run-export";
import type { RubricKind } from "../types";
import { CurrentRunCard } from "./CurrentRunCard";
import { EmptyRunCard } from "./EmptyRunCard";

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
  const { user } = useAuth();
  const canRun = Boolean(user && can(user.permissions, "selection:run"));

  const { data, isPending, isError, refetch } = useSelectionRuns(1);
  const { download, exportPending } = useSelectionRunExport();

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
            exportPending={exportPending}
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
