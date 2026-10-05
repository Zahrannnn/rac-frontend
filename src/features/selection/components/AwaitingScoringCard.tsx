"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { fetchWorkshops } from "@/features/workshops";
import { useAuth, can } from "@/features/auth";
import { useRanking } from "../hooks/use-selection";
import { selectionKeys } from "../utils/query-keys";

/**
 * Workshops whose survey passed validation (status Complete) but which have no validator
 * score row yet — the exact pool the selection engine cannot see. Scored-status or
 * ranked workshops never appear here; scoring a row here makes it rankable on the next
 * selection run (which is also the only path to Scored status).
 */
export function AwaitingScoringCard({
  onScore,
}: {
  onScore: (workshopId: string, label: string) => void;
}) {
  const t = useT();
  const { user } = useAuth();
  const canScore = Boolean(user && can(user.permissions, "selection:score"));

  const complete = useQuery({
    queryKey: selectionKeys.awaitingScoring(),
    queryFn: () => fetchWorkshops({ status: "Complete", page: 1 }),
  });
  const ranking = useRanking();

  if (complete.isPending) {
    return (
      <div className="rounded-lg border bg-card p-4" aria-busy>
        <Skeleton className="h-5 w-56 rounded-md" />
      </div>
    );
  }

  if (complete.isError) {
    return null; // Non-essential surface — the ranking table remains the primary view.
  }

  const rankedIds = new Set((ranking.data ?? []).map((row) => row.workshopId));
  const awaiting = complete.data.items.filter((workshop) => !rankedIds.has(workshop.id));

  if (awaiting.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border bg-card p-4" aria-label={t("selection.awaitingScoring")}>
      <div className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-bold text-[var(--navy)]">
          {t("selection.awaitingScoring")}
          <span className="ms-2 rounded-md bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
            {awaiting.length}
          </span>
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{t("selection.awaitingScoringHint")}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {awaiting.map((workshop) => (
          <li
            key={workshop.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--navy)]">
                <span className="font-mono text-xs font-semibold text-primary">
                  {workshop.code}
                </span>{" "}
                {workshop.nameEn}
              </p>
              <p className="text-xs text-muted-foreground">{workshop.governorate}</p>
            </div>
            {canScore ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onScore(workshop.id, `${workshop.code} — ${workshop.nameEn}`)}
              >
                {t("selection.scoreAction")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
