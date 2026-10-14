"use client";

import { useEffect, useState } from "react";
import type { TechnicianCandidate } from "../types";
import { candidateOptionId, nextAddableCandidate } from "../utils/candidate-search";

/**
 * The highlighted option of the picker listbox (aria-activedescendant model):
 * defaults to the first addable candidate, follows the arrow/Home/End keys,
 * and is kept scrolled into view.
 */
export function useCandidateHighlight({
  baseId,
  candidates,
  enrolledTechnicianIds,
}: {
  baseId: string;
  candidates: TechnicianCandidate[];
  enrolledTechnicianIds: ReadonlySet<string>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const firstAddableIndex = candidates.findIndex(
    (candidate) => !enrolledTechnicianIds.has(candidate.id)
  );
  const chosenIndex = candidates.findIndex((candidate) => candidate.id === activeId);
  const activeIndex =
    candidates.length === 0 ? -1 : chosenIndex >= 0 ? chosenIndex : Math.max(0, firstAddableIndex);
  const active = activeIndex >= 0 ? candidates[activeIndex] : undefined;

  const activeTechnicianId = active?.id;
  useEffect(() => {
    if (activeTechnicianId) {
      document
        .getElementById(candidateOptionId(baseId, activeTechnicianId))
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [activeTechnicianId, baseId]);

  /** Moves the highlight for a navigation key; false when the key isn't one (or the list is empty). */
  const navigate = (key: string): boolean => {
    if (candidates.length === 0) return false;
    const targets: Record<string, number> = {
      ArrowDown: activeIndex + 1,
      ArrowUp: activeIndex - 1,
      Home: 0,
      End: candidates.length - 1,
    };
    if (!(key in targets)) return false;
    const target = candidates[Math.min(Math.max(targets[key], 0), candidates.length - 1)];
    if (target) setActiveId(target.id);
    return true;
  };

  /** After `technicianId` was added, hand the highlight on unless the user moved it elsewhere. */
  const advancePast = (technicianId: string) => {
    const next = nextAddableCandidate(candidates, technicianId, enrolledTechnicianIds);
    setActiveId((current) =>
      current === technicianId || current === null ? (next?.id ?? null) : current
    );
  };

  return { active, activateId: setActiveId, navigate, advancePast };
}
