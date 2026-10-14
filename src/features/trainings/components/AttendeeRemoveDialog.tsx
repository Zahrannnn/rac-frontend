"use client";

import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useT } from "@/shared/i18n";
import type { TrainingAttendee } from "../types";

/** Destructive-action confirmation for removing an attendee (never silent). */
export function AttendeeRemoveDialog({
  attendee,
  isPending,
  onConfirm,
  onClose,
}: {
  attendee: TrainingAttendee | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();

  return (
    <ConfirmDialog
      open={Boolean(attendee)}
      title={t("trainings.removeConfirmTitle")}
      description={t("trainings.removeConfirmMessage", { name: attendee?.technicianName ?? "" })}
      confirmLabel={t("trainings.remove")}
      isPending={isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
