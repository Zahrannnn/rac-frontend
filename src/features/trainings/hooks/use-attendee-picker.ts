"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { useT } from "@/shared/i18n";
import { useCandidateAdd } from "./use-candidate-add";
import { useCandidateHighlight } from "./use-candidate-highlight";
import { useCandidateSearch } from "./use-candidate-search";

/**
 * Behavior of the inline "add participant" combobox: the derived aria ids,
 * the search query, the highlight/add wiring, keyboard routing and the polite
 * results announcement. AttendeePicker owns only the rendering.
 */
export function useAttendeePicker({
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
  const showList = search.candidates.length > 0;

  const highlight = useCandidateHighlight({
    baseId,
    candidates: search.candidates,
    enrolledTechnicianIds,
  });
  const adder = useCandidateAdd({
    trainingId,
    enrolledTechnicianIds,
    onAdded,
    onUndone,
    onAddSucceeded: highlight.advancePast,
  });

  const addActive = () => {
    if (!highlight.active) return false;
    adder.addCandidate(highlight.active);
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
    search.settling || !search.typedReady || search.showError
      ? ""
      : search.showEmpty
        ? t("trainings.candidatesEmpty")
        : t("trainings.candidatesCount", { count: search.candidates.length });

  return {
    baseId,
    inputId,
    labelId,
    listboxId,
    statusId,
    scoresErrorId,
    query,
    setQuery,
    search,
    highlight,
    adder,
    showList,
    addActive,
    onKeyDown,
    resultsAnnouncement,
  };
}
