"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useCandidateAdd } from "../hooks/use-candidate-add";
import { useCandidateHighlight } from "../hooks/use-candidate-highlight";
import { useCandidateSearch } from "../hooks/use-candidate-search";
import { CANDIDATE_RESULT_CAP, candidateOptionId } from "../utils/candidate-search";
import { CandidateOption } from "./CandidateOption";
import { NextAddScoreFields } from "./NextAddScoreFields";

/**
 * Inline "add participant" combobox. Searches the purpose-built
 * technician-candidates endpoint (debounced, min 2 chars, max 20 rows; the
 * full registry is never listed) and adds the chosen technician immediately,
 * keeping the query and focus so several people can be added in a row.
 * The optional scores apply to the next add only.
 */
export function AttendeePicker({
  trainingId,
  enrolledTechnicianIds,
  onAdded,
  onUndone,
}: {
  trainingId: string;
  enrolledTechnicianIds: ReadonlySet<string>;
  onAdded: (technicianId: string) => void;
  onUndone: (technicianId: string) => void;
}) {
  const t = useT();
  const baseId = useId();
  const inputId = `${baseId}-search`;
  const labelId = `${baseId}-label`;
  const listboxId = `${baseId}-listbox`;
  const statusId = `${baseId}-status`;
  const scoresErrorId = `${baseId}-scores-error`;

  const [query, setQuery] = useState("");
  const search = useCandidateSearch(query);
  const { candidates, settling, typedReady } = search;
  const showList = candidates.length > 0;

  const highlight = useCandidateHighlight({ baseId, candidates, enrolledTechnicianIds });
  const { active } = highlight;
  const adder = useCandidateAdd({
    trainingId,
    enrolledTechnicianIds,
    onAdded,
    onUndone,
    onAddSucceeded: highlight.advancePast,
  });

  const addActive = () => {
    if (!active) return false;
    adder.addCandidate(active);
    return true;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (highlight.navigate(event.key)) {
      event.preventDefault();
    } else if (event.key === "Enter" && addActive()) {
      event.preventDefault();
    } else if (event.key === "Escape" && query) {
      // Clear first; a second Escape is left to whatever hosts the picker.
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
    }
  };

  const resultsAnnouncement =
    settling || !typedReady || search.showError
      ? ""
      : search.showEmpty
        ? t("trainings.candidatesEmpty")
        : t("trainings.candidatesCount", { count: candidates.length });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex flex-col gap-1.5">
          <Label id={labelId} htmlFor={inputId}>
            {t("trainings.addParticipant")}
          </Label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id={inputId}
              type="text"
              role="combobox"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-autocomplete="list"
              aria-expanded={showList}
              aria-controls={listboxId}
              aria-activedescendant={active ? candidateOptionId(baseId, active.id) : undefined}
              aria-describedby={statusId}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                adder.clearNotice();
              }}
              onKeyDown={onKeyDown}
              placeholder={t("trainings.searchTechnicianPlaceholder")}
              className="h-11 ps-9 pe-10"
            />
            <span className="absolute end-1.5 top-1/2 flex -translate-y-1/2 items-center">
              {settling ? (
                <Loader2
                  aria-hidden
                  className="m-2 size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
                />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("trainings.clearSearch")}
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </span>
          </div>
        </div>

        <NextAddScoreFields
          baseId={baseId}
          errorId={scoresErrorId}
          scores={adder.scores}
          invalid={adder.scoresInvalid}
          onScoreChange={adder.setScore}
          onSubmit={addActive}
        />
      </div>

      {adder.scoresInvalid ? (
        <p id={scoresErrorId} className="text-xs text-destructive">
          {t("trainings.scoreInvalid")}
        </p>
      ) : null}

      <p id={statusId} className="text-xs text-muted-foreground empty:hidden">
        {typedReady ? null : t("trainings.candidatesHint")}
      </p>

      {search.firstLoad ? (
        <div className="flex flex-col gap-px overflow-hidden rounded-lg border" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 bg-card px-3 py-3">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      ) : null}

      {search.showError ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <span>{t("trainings.candidatesFailed")}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => search.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      {search.showEmpty ? (
        <div className="rounded-lg border border-dashed px-3 py-4 text-sm">
          <p className="font-medium text-[var(--navy)]">{t("trainings.candidatesEmpty")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("trainings.candidatesEmptyHint")}</p>
        </div>
      ) : null}

      <ul
        id={listboxId}
        role="listbox"
        aria-labelledby={labelId}
        aria-busy={settling || undefined}
        hidden={!showList}
        className={cn(
          "max-h-[22rem] overflow-y-auto overscroll-contain rounded-lg border bg-card transition-opacity duration-200 motion-reduce:transition-none",
          settling && "opacity-60"
        )}
      >
        {candidates.map((candidate) => (
          <CandidateOption
            key={candidate.id}
            id={candidateOptionId(baseId, candidate.id)}
            candidate={candidate}
            enrolled={enrolledTechnicianIds.has(candidate.id)}
            status={adder.rowStatus[candidate.id]}
            isActive={candidate.id === active?.id}
            onActivate={() => highlight.activateId(candidate.id)}
            onPick={() => adder.addCandidate(candidate)}
          />
        ))}
      </ul>

      {showList && candidates.length >= CANDIDATE_RESULT_CAP ? (
        <p className="text-xs text-muted-foreground">
          {t("trainings.candidatesCap", { count: CANDIDATE_RESULT_CAP })}
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {resultsAnnouncement}
      </p>
      <p className="sr-only" aria-live="assertive">
        {adder.notice}
      </p>
    </div>
  );
}
