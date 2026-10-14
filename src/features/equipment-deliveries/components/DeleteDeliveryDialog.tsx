"use client";

import { ConfirmDialog } from "@/shared/components/confirm-dialog";
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
    <ConfirmDialog
      open={Boolean(pendingDelete)}
      title={t("equipment.delete")}
      description={t("equipment.deleteConfirm", {
        workshop: pendingDelete
          ? `${pendingDelete.workshopCode} · ${pendingDelete.workshopName}`
          : "",
      })}
      confirmLabel={t("equipment.delete")}
      isPending={isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
