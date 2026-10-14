"use client";

import { useMemo, useRef, useState } from "react";
import { Pencil, Trash2, Users } from "lucide-react";
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
import { Section } from "@/shared/components/section";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useAttendeeMutations } from "../hooks/use-trainings";
import type { TrainingAttendee } from "../types";
import { AttendeePicker } from "./AttendeePicker";
import { AttendeeRemoveDialog } from "./AttendeeRemoveDialog";
import { AttendeeScoresDialog } from "./AttendeeScoresDialog";

/** Navy shell shared by every header cell of the attendees table. */
const TABLE_HEAD_CLASS = "h-10 bg-[var(--navy-shell)] text-xs text-white";

/** How long a freshly added participant row stays tinted. */
const HIGHLIGHT_MS = 2400;

const withId = (set: ReadonlySet<string>, id: string) => new Set(set).add(id);
const withoutId = (set: ReadonlySet<string>, id: string) => {
  const next = new Set(set);
  next.delete(id);
  return next;
};

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
  const [editing, setEditing] = useState<TrainingAttendee | null>(null);
  const [pendingRemove, setPendingRemove] = useState<TrainingAttendee | null>(null);

  // Adds the server has confirmed but the refetched attendee list may not include yet.
  const [localAdds, setLocalAdds] = useState<ReadonlySet<string>>(new Set());
  const [highlighted, setHighlighted] = useState<ReadonlySet<string>>(new Set());
  const highlightTimers = useRef(new Map<string, number>());

  const enrolledTechnicianIds = useMemo(
    () => new Set([...attendees.map((a) => a.technicianId), ...localAdds]),
    [attendees, localAdds]
  );

  const onAdded = (technicianId: string) => {
    setLocalAdds((current) => withId(current, technicianId));
    setHighlighted((current) => withId(current, technicianId));
    window.clearTimeout(highlightTimers.current.get(technicianId));
    highlightTimers.current.set(
      technicianId,
      window.setTimeout(
        () => setHighlighted((current) => withoutId(current, technicianId)),
        HIGHLIGHT_MS
      )
    );
  };

  const onUndone = (technicianId: string) => {
    setLocalAdds((current) => withoutId(current, technicianId));
    setHighlighted((current) => withoutId(current, technicianId));
  };

  const confirmRemove = () => {
    if (!pendingRemove) {
      return;
    }
    const removed = pendingRemove;
    remove.mutate(removed.id, {
      onSuccess: () => {
        setPendingRemove(null);
        onUndone(removed.technicianId);
        toast.success(t("trainings.attendeeRemoved"));
      },
      onError: () => toast.error(t("trainings.attendeeRemoveFailed")),
    });
  };

  return (
    <Section
      className="gap-4"
      headingId="attendees-heading"
      title={
        <>
          {t("trainings.participants")}{" "}
          <span className="font-normal tabular-nums text-muted-foreground">
            ({attendees.length})
          </span>
        </>
      }
    >

      {canEdit ? (
        <AttendeePicker
          trainingId={trainingId}
          enrolledTechnicianIds={enrolledTechnicianIds}
          onAdded={onAdded}
          onUndone={onUndone}
        />
      ) : null}

      {attendees.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
          <Users className="size-7 text-muted-foreground" aria-hidden />
          <p className="font-medium text-[var(--navy)]">{t("trainings.attendeesEmpty")}</p>
          {canEdit ? (
            <p className="max-w-[44ch] text-sm text-muted-foreground">
              {t("trainings.attendeesEmptyHint")}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border max-sm:border-0">
          <Table className="max-sm:block">
            <TableHeader className="max-sm:sr-only">
              <TableRow className="hover:bg-transparent">
                <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.technician")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.preScore")}</TableHead>
                <TableHead className={TABLE_HEAD_CLASS}>{t("trainings.postScore")}</TableHead>
                {canEdit ? (
                  <TableHead className={`${TABLE_HEAD_CLASS} w-24`}>
                    <span className="sr-only">{t("trainings.rowActions")}</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody className="max-sm:flex max-sm:flex-col max-sm:gap-2">
              {attendees.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    "h-12 transition-colors duration-700 motion-reduce:transition-none",
                    "max-sm:grid max-sm:h-auto max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:rounded-lg max-sm:border max-sm:px-3 max-sm:py-2.5",
                    highlighted.has(row.technicianId) && "bg-[var(--accent)]"
                  )}
                >
                  <TableCell className="font-medium max-sm:col-span-1 max-sm:p-0">
                    {row.technicianName}
                  </TableCell>
                  <TableCell className="tabular-nums max-sm:col-start-1 max-sm:p-0 max-sm:pt-1 max-sm:text-xs max-sm:text-muted-foreground">
                    <span className="sm:hidden">{t("trainings.preScoreShort")}: </span>
                    {row.preScore ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums max-sm:col-start-1 max-sm:p-0 max-sm:text-xs max-sm:text-muted-foreground">
                    <span className="sm:hidden">{t("trainings.postScoreShort")}: </span>
                    {row.postScore ?? "—"}
                  </TableCell>
                  {canEdit ? (
                    <TableCell className="max-sm:col-start-2 max-sm:row-span-3 max-sm:row-start-1 max-sm:self-center max-sm:p-0">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="max-sm:size-10"
                          onClick={() => setEditing(row)}
                          aria-label={t("trainings.editScores")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive max-sm:size-10"
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
    </Section>
  );
}
