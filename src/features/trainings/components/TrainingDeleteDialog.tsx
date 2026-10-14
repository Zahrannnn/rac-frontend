"use client";

import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { useT } from "@/shared/i18n";
import type { TrainingListItem } from "../types";

export function TrainingDeleteDialog({
  pendingDelete,
  isPending,
  onConfirm,
  onClose,
}: {
  pendingDelete: TrainingListItem | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const t = useT();

  return (
    <ConfirmDialog
      open={Boolean(pendingDelete)}
      title={t("trainings.deleteTitle")}
      description={t("trainings.deleteMessage", {
        name: pendingDelete?.title || pendingDelete?.venue || "",
      })}
      confirmLabel={isPending ? t("trainings.deleting") : t("trainings.delete")}
      isPending={isPending}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      <p className="text-sm font-medium text-destructive">{t("trainings.deleteIrreversible")}</p>
    </ConfirmDialog>
  );
}
