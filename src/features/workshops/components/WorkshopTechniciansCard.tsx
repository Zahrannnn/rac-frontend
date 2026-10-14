"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import { useAuth, can } from "@/features/auth";
import { useMounted } from "@/shared/hooks/use-mounted";
import {
  TechnicianDialog,
  useTechnicians,
  type Technician,
} from "@/features/technicians";
import { DeactivateConfirmDialog, TechnicianRow } from "./TechnicianRow";

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
