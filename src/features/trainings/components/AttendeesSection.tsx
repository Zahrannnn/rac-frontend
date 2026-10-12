"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import { useAttendeeMutations } from "../hooks/use-trainings";
import type { TrainingAttendee } from "../types";
import { AddAttendeeDialog } from "./AddAttendeeDialog";
import { AttendeeRemoveDialog } from "./AttendeeRemoveDialog";
import { AttendeeScoresDialog } from "./AttendeeScoresDialog";

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
  const { remove } = useAttendeeMutations(trainingId);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingAttendee | null>(null);
  const [pendingRemove, setPendingRemove] = useState<TrainingAttendee | null>(null);

  const confirmRemove = () => {
    if (!pendingRemove) {
      return;
    }
    remove.mutate(pendingRemove.id, {
      onSuccess: () => {
        setPendingRemove(null);
        toast.success(t("trainings.attendeeRemoved"));
      },
      onError: () => toast.error(t("trainings.attendeeRemoveFailed")),
    });
  };

  return (
    <section className="flex flex-col gap-3" aria-labelledby="attendees-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="attendees-heading" className="text-sm font-semibold text-[var(--navy)]">
          {t("trainings.participants")} ({attendees.length})
        </h3>
        {canEdit ? (
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus data-icon="inline-start" />
            {t("trainings.addParticipant")}
          </Button>
        ) : null}
      </div>

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
                  <TableHead className={`${TABLE_HEAD_CLASS} w-24`} />
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
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(row)}
                          aria-label={t("trainings.editScores")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setPendingRemove(row)}
                          aria-label={t("trainings.removeAttendee")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canEdit ? (
        <>
          <AddAttendeeDialog
            trainingId={trainingId}
            open={addOpen}
            onOpenChange={setAddOpen}
          />
          <AttendeeScoresDialog
            trainingId={trainingId}
            attendee={editing}
            onOpenChange={(open) => !open && setEditing(null)}
          />
          <AttendeeRemoveDialog
            attendee={pendingRemove}
            isPending={remove.isPending}
            onConfirm={confirmRemove}
            onClose={() => setPendingRemove(null)}
          />
        </>
      ) : null}
    </section>
  );
}
