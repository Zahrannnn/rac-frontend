"use client";

import Link from "next/link";
import { Pencil, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
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
import {
  TechnicianStatusBadge,
  useUpdateTechnician,
  type Technician,
} from "@/features/technicians";

/** One technician in the workshop's team list, with edit/activate actions. */
export function TechnicianRow({
  technician,
  canEdit,
  onEdit,
  onDeactivate,
}: {
  technician: Technician;
  canEdit: boolean;
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const t = useT();
  const activate = useUpdateTechnician(technician.id);
  const title = technician.fullNameAr || technician.fullName;
  const isActive = technician.status === "Active";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/technicians/${technician.id}`}
            className="font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {title}
          </Link>
          <TechnicianStatusBadge status={technician.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          <span className="tabular-nums" dir="ltr">
            {technician.mobile ?? "—"}
          </span>
          {technician.specialty ? ` · ${technician.specialty}` : ""}
          {` · ${t("technicians.yearsShort", { count: technician.yearsOfExperience })}`}
        </p>
      </div>

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            <Pencil data-icon="inline-start" />
            {t("workshopTechnicians.edit")}
          </Button>
          {isActive ? (
            <Button type="button" variant="ghost" size="sm" onClick={onDeactivate}>
              <UserMinus data-icon="inline-start" />
              {t("workshopTechnicians.deactivate")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activate.isPending}
              onClick={() =>
                activate.mutate(
                  { status: "Active" },
                  {
                    onSuccess: () => toast.success(t("workshopTechnicians.activated")),
                    onError: (error) => {
                      if ((error as { status?: number }).status !== 403) {
                        toast.error(`${t("common.error")} — ${t("common.retry")}`);
                      }
                    },
                  }
                )
              }
            >
              <UserPlus data-icon="inline-start" />
              {t("workshopTechnicians.activate")}
            </Button>
          )}
        </div>
      ) : null}
    </li>
  );
}

/** Confirms deactivating a technician (PATCH status=Inactive). */
export function DeactivateConfirmDialog({
  technician,
  onClose,
}: {
  technician: Technician | null;
  onClose: () => void;
}) {
  const t = useT();
  const update = useUpdateTechnician(technician?.id ?? "");
  const name = technician ? technician.fullNameAr || technician.fullName : "";

  return (
    <Dialog open={technician !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" aria-describedby={undefined}>
        <DialogHeader className="pb-6">
          <DialogTitle>{t("workshopTechnicians.deactivateConfirm", { name })}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("workshopTechnicians.deactivate")}
          </DialogDescription>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("workshopTechnicians.deactivateHint")}
          </p>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("profile.cancel")}
          </Button>
          <Button
            type="button"
            disabled={update.isPending || !technician}
            onClick={() => {
              if (!technician) return;
              update.mutate(
                { status: "Inactive" },
                {
                  onSuccess: () => {
                    onClose();
                    toast.success(t("workshopTechnicians.deactivated"));
                  },
                  onError: (error) => {
                    if ((error as { status?: number }).status !== 403) {
                      toast.error(`${t("common.error")} — ${t("common.retry")}`);
                    }
                  },
                }
              );
            }}
          >
            {t("workshopTechnicians.deactivate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
