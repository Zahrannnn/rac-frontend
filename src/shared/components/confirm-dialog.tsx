"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/shared/i18n";

export type ConfirmDialogProps = {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: ReactNode;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Extra copy under the description, e.g. an irreversibility warning. */
  children?: ReactNode;
};

/** Destructive-action confirmation: warning icon, cancel, and a destructive confirm. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isPending,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="sm">
        <DialogHeader className="flex-row items-start gap-4 pb-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {children}
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
