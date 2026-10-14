"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {technician ? t("technicians.editTitle") : t("technicians.createTitle")}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {technician ? t("technicians.editTitle") : t("technicians.createTitle")}
            </DialogDescription>
          </DialogHeader>
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
