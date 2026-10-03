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
import type { EquipmentDelivery } from "../types";

export function DeleteDeliveryDialog({
  pendingDelete,
  isPending,
  onConfirm,
  onClose,
}: {
  pendingDelete: EquipmentDelivery | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();

  return (
    <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <DialogTitle>{t("equipment.delete")}</DialogTitle>
            <DialogDescription className="mt-1">
              {t("equipment.deleteConfirm")}
            </DialogDescription>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {t("equipment.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
