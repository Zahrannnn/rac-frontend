"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import { useMounted } from "@/shared/hooks/use-mounted";
import {
  TechnicianDialog,
  TechnicianStatusBadge,
  useTechnicians,
  useUpdateTechnician,
  type Technician,
} from "@/features/technicians";

export function WorkshopTechniciansCard({
  workshopId,
  workshopCode,
  workshopName,
}: {
  workshopId: string;
  workshopCode: string;
  workshopName: string;
}) {
  const t = useT();
  const { user } = useAuth();
  const mounted = useMounted();
  const canCreate = mounted && Boolean(user && can(user.permissions, "technicians:create"));
  const canEdit = mounted && Boolean(user && can(user.permissions, "technicians:edit"));

  const { data, isPending, isError } = useTechnicians({
    page: 1,
    workshopId,
  });

  const [dialogTechnician, setDialogTechnician] = useState<Technician | null | "new">(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Technician | null>(null);

  const workshopLabel = `${workshopCode} — ${workshopName}`;
  const items = data?.items ?? [];

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--navy)]">{t("workshopTechnicians.title")}</h2>
        {canCreate ? (
          <Button type="button" size="sm" onClick={() => setDialogTechnician("new")}>
            <Plus data-icon="inline-start" />
            {t("technicians.add")}
          </Button>
        ) : null}
      </div>

      {isPending ? (
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <p className="mt-3 text-sm text-destructive">{t("common.error")}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("workshopTechnicians.empty")}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y">
          {items.map((technician) => (
            <TechnicianRow
              key={technician.id}
              technician={technician}
              canEdit={canEdit}
              onEdit={() => setDialogTechnician(technician)}
              onDeactivate={() => setDeactivateTarget(technician)}
            />
          ))}
        </ul>
      )}

      <TechnicianDialog
        open={dialogTechnician !== null}
        onOpenChange={(open) => {
          if (!open) setDialogTechnician(null);
        }}
        technician={dialogTechnician === "new" ? null : dialogTechnician}
        lockedWorkshopId={dialogTechnician === "new" ? workshopId : undefined}
        lockedWorkshopLabel={dialogTechnician === "new" ? workshopLabel : undefined}
      />

      <DeactivateConfirmDialog
        technician={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
      />
    </section>
  );
}

function TechnicianRow({
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
            {technician.mobile}
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

function DeactivateConfirmDialog({
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
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogTitle>{t("workshopTechnicians.deactivateConfirm", { name })}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("workshopTechnicians.deactivate")}
        </DialogDescription>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("workshopTechnicians.deactivateHint")}
        </p>
        <div className="mt-4 flex justify-end gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
