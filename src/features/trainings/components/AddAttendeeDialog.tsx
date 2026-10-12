"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useT } from "@/shared/i18n";
import { useAttendeeMutations, useTechnicianCandidates } from "../hooks/use-trainings";
import { isCandidateSearchReady } from "../utils/candidate-search";
import { parseAttendeeScorePair } from "../utils/attendee-scores";

/**
 * "Add participant" dialog — the technician picker searches the purpose-built
 * technician-candidates endpoint (debounced, min 2 chars) rather than paging
 * the full technicians registry. Scores are optional.
 */
export function AddAttendeeDialog({
  trainingId,
  open,
  onOpenChange,
}: {
  trainingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { add } = useAttendeeMutations(trainingId);

  const [search, setSearch] = useState("");
  // Debounced so the candidates query fires after typing settles, not per keystroke.
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  const searchReady = isCandidateSearchReady(debouncedSearch);
  const { data: candidates, isFetching } = useTechnicianCandidates(debouncedSearch);

  const [technicianId, setTechnicianId] = useState("");
  const [preScore, setPreScore] = useState("");
  const [postScore, setPostScore] = useState("");

  // Fresh form every time the dialog opens (same render-phase pattern as TrainingFormDialog).
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setSearch("");
      setTechnicianId("");
      setPreScore("");
      setPostScore("");
    }
  }

  const submit = () => {
    if (!technicianId) {
      toast.error(t("trainings.attendeeRequired"));
      return;
    }
    const scores = parseAttendeeScorePair(preScore, postScore);
    if (!scores) {
      toast.error(t("trainings.scoreInvalid"));
      return;
    }

    add.mutate(
      { technicianId, preScore: scores.pre, postScore: scores.post },
      {
        onSuccess: () => {
          toast.success(t("trainings.attendeeAdded"));
          onOpenChange(false);
        },
        onError: (error) => {
          const status = (error as { status?: number }).status;
          toast.error(
            status === 409 ? t("trainings.attendeeDuplicate") : t("trainings.attendeeFailed")
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{t("trainings.addParticipant")}</DialogTitle>
        <DialogDescription className="mt-1">
          {t("trainings.addParticipantHint")}
        </DialogDescription>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendee-candidate-search">{t("trainings.searchTechnician")}</Label>
            <Input
              id="attendee-candidate-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("trainings.searchTechnicianPlaceholder")}
            />
          </div>

          {!searchReady ? (
            <p className="text-xs text-muted-foreground">{t("trainings.candidatesHint")}</p>
          ) : isFetching ? (
            <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
          ) : (candidates ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("trainings.candidatesEmpty")}</p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendee-candidate-select">{t("trainings.technician")}</Label>
            <select
              id="attendee-candidate-select"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">{t("trainings.pickTechnician")}</option>
              {(candidates ?? []).map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.fullName} · {candidate.workshopCode}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attendee-pre-score">{t("trainings.preScore")}</Label>
              <Input
                id="attendee-pre-score"
                type="number"
                min={0}
                max={100}
                value={preScore}
                onChange={(e) => setPreScore(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="attendee-post-score">{t("trainings.postScore")}</Label>
              <Input
                id="attendee-post-score"
                type="number"
                min={0}
                max={100}
                value={postScore}
                onChange={(e) => setPostScore(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={add.isPending} onClick={submit}>
            <UserPlus data-icon="inline-start" />
            {t("trainings.add")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
