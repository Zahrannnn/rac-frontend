"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useT } from "@/shared/i18n";
import { useTechnicians } from "@/features/technicians";
import { useAttendeeMutations } from "../hooks/use-trainings";
import type { TrainingAttendee } from "../types";
import { parseAttendeeScorePair } from "../utils/attendee-scores";

/** Navy shell shared by every header cell of the attendees table. */
const TABLE_HEAD_CLASS = "h-10 bg-[var(--navy-shell)] text-xs text-white";

export function AttendeesSection({
  trainingId,
  attendees,
  canEdit,
}: {
  trainingId: string;
  attendees: TrainingAttendee[];
  canEdit: boolean;
}) {
  const t = useT();
  const { add, remove } = useAttendeeMutations(trainingId);
  const [search, setSearch] = useState("");
  // Debounced so the technician query fires after typing settles, not per keystroke.
  const technicianQuery = useDebouncedValue(search.trim(), 400);
  const { data: techs } = useTechnicians({ page: 1, search: technicianQuery || undefined });
  const [techId, setTechId] = useState("");
  const [preScore, setPreScore] = useState("");
  const [postScore, setPostScore] = useState("");

  const addAttendee = () => {
    if (!techId) {
      toast.error(t("trainings.attendeeRequired"));
      return;
    }
    const scores = parseAttendeeScorePair(preScore, postScore);
    if (!scores) {
      toast.error(t("trainings.scoreInvalid"));
      return;
    }

    add.mutate(
      { technicianId: techId, preScore: scores.pre, postScore: scores.post },
      {
        onSuccess: () => {
          toast.success(t("trainings.attendeeAdded"));
          setTechId("");
          setPreScore("");
          setPostScore("");
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
    <section className="flex flex-col gap-3" aria-labelledby="attendees-heading">
      <h3 id="attendees-heading" className="text-sm font-semibold text-[var(--navy)]">
        {t("trainings.attendees")} ({attendees.length})
      </h3>

      {canEdit ? (
        <div className="flex flex-col gap-2 rounded-lg border p-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("trainings.searchTechnician")}
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={techId}
            onChange={(e) => setTechId(e.target.value)}
            aria-label={t("trainings.technician")}
          >
            <option value="">{t("trainings.pickTechnician")}</option>
            {(techs?.items ?? []).map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.fullName} · {tech.workshopCode}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              max={100}
              value={preScore}
              onChange={(e) => setPreScore(e.target.value)}
              placeholder={t("trainings.preScore")}
            />
            <Input
              type="number"
              min={0}
              max={100}
              value={postScore}
              onChange={(e) => setPostScore(e.target.value)}
              placeholder={t("trainings.postScore")}
            />
          </div>
          <Button type="button" size="sm" disabled={add.isPending} onClick={addAttendee}>
            <UserPlus data-icon="inline-start" />
            {t("trainings.addAttendee")}
          </Button>
        </div>
      ) : null}

      {attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("trainings.attendeesEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={TABLE_HEAD_CLASS}>
                  {t("trainings.technician")}
                </TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>
                  {t("trainings.preScore")}
                </TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>
                  {t("trainings.postScore")}
                </TableHead>
                {canEdit ? (
                  <TableHead className={`${TABLE_HEAD_CLASS} w-16`} />
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendees.map((row) => (
                <TableRow key={row.id} className="h-12">
                  <TableCell className="font-medium">{row.technicianName}</TableCell>
                  <TableCell className="tabular-nums">{row.preScore ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{row.postScore ?? "—"}</TableCell>
                  {canEdit ? (
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={remove.isPending}
                        onClick={() =>
                          remove.mutate(row.id, {
                            onSuccess: () => toast.success(t("trainings.attendeeRemoved")),
                            onError: () => toast.error(t("trainings.attendeeRemoveFailed")),
                          })
                        }
                        aria-label={t("trainings.removeAttendee")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
