"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/shared/components/section";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { useAttendeeHighlights } from "../hooks/use-attendee-highlights";
import { useAttendeeMutations } from "../hooks/use-trainings";
import type { TrainingAttendee } from "../types";
import { AttendeePicker } from "./AttendeePicker";
import { AttendeeRemoveDialog } from "./AttendeeRemoveDialog";
import { AttendeeScoresDialog } from "./AttendeeScoresDialog";

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

  const { enrolledTechnicianIds, highlighted, onAdded, onUndone } =
    useAttendeeHighlights(attendees);

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

  // Client array — the full attendee list is sortable in place. Scores read
  // best highest-first; missing scores sort as -1 so they sink.
  const columns: DataTableColumn<TrainingAttendee>[] = [
    {
      key: "technician",
      header: t("trainings.technician"),
      cell: (row) => <span className="font-medium">{row.technicianName}</span>,
      sortValue: (row) => row.technicianName,
    },
    {
      key: "preScore",
      header: t("trainings.preScore"),
      cell: (row) => <span className="tabular-nums">{row.preScore ?? "—"}</span>,
      sortValue: (row) => row.preScore ?? -1,
      sortDescFirst: true,
    },
    {
      key: "postScore",
      header: t("trainings.postScore"),
      cell: (row) => <span className="tabular-nums">{row.postScore ?? "—"}</span>,
      sortValue: (row) => row.postScore ?? -1,
      sortDescFirst: true,
    },
  ];

  const actionButtons = (row: TrainingAttendee) => (
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
  );

  if (canEdit) {
    columns.push({
      key: "actions",
      header: t("trainings.rowActions"),
      headerClassName: "sr-only",
      className: "w-24",
      cell: actionButtons,
    });
  }

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

      <DataTable<TrainingAttendee>
        columns={columns}
        data={attendees}
        getRowId={(row) => row.id}
        ariaLabel={t("trainings.participants")}
        emptyState={
          canEdit
            ? { title: t("trainings.attendeesEmpty"), hint: t("trainings.attendeesEmptyHint") }
            : { title: t("trainings.attendeesEmpty") }
        }
        rowClassName={(row) =>
          highlighted.has(row.technicianId) ? "bg-[var(--accent)]" : undefined
        }
        mobileCard={(row) => (
          <div
            className={cn(
              "rounded-lg border px-3 py-2.5",
              highlighted.has(row.technicianId) && "bg-[var(--accent)]"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{row.technicianName}</span>
              {canEdit ? actionButtons(row) : null}
            </div>
            <p className="pt-1 text-xs tabular-nums text-muted-foreground">
              {t("trainings.preScoreShort")}: {row.preScore ?? "—"} ·{" "}
              {t("trainings.postScoreShort")}: {row.postScore ?? "—"}
            </p>
          </div>
        )}
      />

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
