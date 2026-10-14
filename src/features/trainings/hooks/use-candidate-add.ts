"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useI18n, useT } from "@/shared/i18n";
import type { TechnicianCandidate } from "../types";
import { parseAttendeeScorePair } from "../utils/attendee-scores";
import { candidateNames, toWesternDigits } from "../utils/candidate-search";
import { useAttendeeMutations } from "./use-trainings";

export type CandidateRowStatus = { state: "adding" } | { state: "failed"; message: string };
export type ScoreKey = "pre" | "post";

/**
 * The picker's add flow: per-row adding/failed status, the optional scores for
 * the next add, the assertive notice text, and an Undo toast after each add.
 * Several adds may be in flight at once.
 */
export function useCandidateAdd({
  trainingId,
  enrolledTechnicianIds,
  onAdded,
  onUndone,
  onAddSucceeded,
}: {
  trainingId: string;
  enrolledTechnicianIds: ReadonlySet<string>;
  onAdded: (technicianId: string) => void;
  onUndone: (technicianId: string) => void;
  /** Runs after `onAdded` for a fresh add (not for a 409 already-enrolled). */
  onAddSucceeded: (technicianId: string) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const { add, remove } = useAttendeeMutations(trainingId);

  const [rowStatus, setRowStatus] = useState<Record<string, CandidateRowStatus>>({});
  const [scores, setScores] = useState<Record<ScoreKey, string>>({ pre: "", post: "" });
  const [scoresInvalid, setScoresInvalid] = useState(false);
  const [notice, setNotice] = useState("");

  const setStatus = (technicianId: string, status: CandidateRowStatus | null) =>
    setRowStatus((current) => {
      const next = { ...current };
      if (status) next[technicianId] = status;
      else delete next[technicianId];
      return next;
    });

  const setScore = (key: ScoreKey, raw: string) => {
    setScores((current) => ({ ...current, [key]: toWesternDigits(raw) }));
    setScoresInvalid(false);
  };

  const undo = (attendeeId: string, technicianId: string, name: string) => {
    remove
      .mutateAsync(attendeeId)
      .then(() => {
        onUndone(technicianId);
        toast(t("trainings.attendeeAddUndone", { name }));
      })
      .catch(() => toast.error(t("trainings.attendeeUndoFailed")));
  };

  const addCandidate = (candidate: TechnicianCandidate) => {
    const name = candidateNames(candidate, locale).primary;
    if (enrolledTechnicianIds.has(candidate.id)) {
      setNotice(t("trainings.alreadyEnrolledNamed", { name }));
      return;
    }
    if (rowStatus[candidate.id]?.state === "adding") {
      return;
    }
    const parsed = parseAttendeeScorePair(scores.pre, scores.post);
    if (!parsed) {
      setScoresInvalid(true);
      setNotice(t("trainings.scoreInvalid"));
      return;
    }

    setStatus(candidate.id, { state: "adding" });
    // mutateAsync: per-call mutate() callbacks only fire for the latest call.
    add
      .mutateAsync({ technicianId: candidate.id, preScore: parsed.pre, postScore: parsed.post })
      .then((created) => {
        setStatus(candidate.id, null);
        setScores({ pre: "", post: "" });
        setScoresInvalid(false);
        onAdded(candidate.id);
        onAddSucceeded(candidate.id);
        toast.success(t("trainings.attendeeAddedNamed", { name }), {
          duration: 6000,
          action: {
            label: t("trainings.undo"),
            onClick: () => undo(created.id, candidate.id, name),
          },
        });
      })
      .catch((error: { status?: number }) => {
        if (error.status === 409) {
          setStatus(candidate.id, null);
          onAdded(candidate.id);
          setNotice(t("trainings.alreadyEnrolledNamed", { name }));
          return;
        }
        const message = t("trainings.attendeeFailed");
        setStatus(candidate.id, { state: "failed", message });
        setNotice(`${name}: ${message}`);
      });
  };

  return {
    rowStatus,
    scores,
    setScore,
    scoresInvalid,
    notice,
    clearNotice: () => setNotice(""),
    addCandidate,
  };
}
