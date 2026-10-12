"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { useAttendeeMutations } from "../hooks/use-trainings";
import type { TrainingAttendee } from "../types";
import { parseAttendeeScorePair } from "../utils/attendee-scores";

/** Per-row pre/post score editing (PUT) for one attendee. Blank inputs mean
 * "no score recorded" (null), mirroring the add flow's tri-state rule. */
export function AttendeeScoresDialog({
  trainingId,
  attendee,
  onOpenChange,
}: {
  trainingId: string;
  attendee: TrainingAttendee | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { update } = useAttendeeMutations(trainingId);

  const open = Boolean(attendee);

  // Re-seed the inputs every time the dialog opens for an attendee, so a
  // cancelled or stale editing session never leaks into the next one.
  const [prevAttendee, setPrevAttendee] = useState(attendee);
  const [preScore, setPreScore] = useState("");
  const [postScore, setPostScore] = useState("");
  if (attendee !== prevAttendee) {
    setPrevAttendee(attendee);
    if (attendee) {
      setPreScore(attendee.preScore === null ? "" : String(attendee.preScore));
      setPostScore(attendee.postScore === null ? "" : String(attendee.postScore));
    }
  }

  const save = () => {
    if (!attendee) {
      return;
    }
    const scores = parseAttendeeScorePair(preScore, postScore);
    if (!scores) {
      toast.error(t("trainings.scoreInvalid"));
      return;
    }

    update.mutate(
      { attendeeId: attendee.id, payload: { preScore: scores.pre, postScore: scores.post } },
      {
        onSuccess: () => {
          toast.success(t("trainings.scoresUpdated"));
          onOpenChange(false);
        },
        onError: () => toast.error(t("trainings.scoresUpdateFailed")),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t("trainings.editScores")}</DialogTitle>
        <DialogDescription className="mt-1">{attendee?.technicianName}</DialogDescription>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-pre-score">{t("trainings.preScore")}</Label>
            <Input
              id="edit-pre-score"
              type="number"
              min={0}
              max={100}
              value={preScore}
              onChange={(e) => setPreScore(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-post-score">{t("trainings.postScore")}</Label>
            <Input
              id="edit-post-score"
              type="number"
              min={0}
              max={100}
              value={postScore}
              onChange={(e) => setPostScore(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={update.isPending} onClick={save}>
            {t("trainings.saveScores")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
