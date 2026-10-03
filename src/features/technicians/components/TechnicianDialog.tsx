"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/shared/i18n";
import type { Technician } from "../types";
import { TechnicianForm } from "./TechnicianForm";

export function TechnicianDialog({
  open,
  onOpenChange,
  technician,
  lockedWorkshopId,
  lockedWorkshopLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode */
  technician: Technician | null;
  /** When set (create from workshop profile), workshop is fixed and the picker is hidden. */
  lockedWorkshopId?: string;
  lockedWorkshopLabel?: string;
}) {
  const t = useT();
  const formKey = technician?.id ?? `new-${lockedWorkshopId ?? "any"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogTitle>
            {technician ? t("technicians.editTitle") : t("technicians.createTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {technician ? t("technicians.editTitle") : t("technicians.createTitle")}
          </DialogDescription>
          <TechnicianForm
            key={formKey}
            technician={technician}
            lockedWorkshopId={lockedWorkshopId}
            lockedWorkshopLabel={lockedWorkshopLabel}
            onDone={() => onOpenChange(false)}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
