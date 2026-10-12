"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={Boolean(attendee)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle>{t("trainings.removeConfirmTitle")}</DialogTitle>
            <DialogDescription className="mt-1">
              {t("trainings.removeConfirmMessage", { name: attendee?.technicianName ?? "" })}
            </DialogDescription>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {t("trainings.remove")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
