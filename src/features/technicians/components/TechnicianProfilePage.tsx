"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/shared/components/layout/page-header";
import { useT } from "@/shared/i18n";
import { formatDateUtc } from "@/shared/utils/datetime";
import { useAuth, can } from "@/features/auth";
import { useTechnician } from "../hooks/use-technicians";
import { TechnicianDialog } from "./TechnicianDialog";
import { TechnicianStatusBadge } from "./TechnicianStatusBadge";

export function TechnicianProfilePage({ technicianId }: { technicianId: string }) {
  const t = useT();
  const { user } = useAuth();
  const { data: technician, isPending, isError } = useTechnician(technicianId);
  const [editOpen, setEditOpen] = useState(false);
  const canEdit = Boolean(user && can(user.permissions, "technicians:edit"));

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-busy>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !technician) {
    return (
      <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <h1 className="text-xl font-bold text-[var(--navy)]">{t("technicians.notFound")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("technicians.notFoundMessage")}</p>
        <Button asChild variant="outline">
          <Link href="/technicians">{t("profile.backToList")}</Link>
        </Button>
      </main>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={technician.fullNameAr || technician.fullName}
        description={technician.fullNameAr ? technician.fullName : undefined}
      >
        {canEdit ? (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil data-icon="inline-start" />
            {t("profile.edit")}
          </Button>
        ) : null}
      </PageHeader>

      <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <TechnicianStatusBadge status={technician.status} />
          <Link
            href={`/workshops/${technician.workshopId}`}
            className="rounded-md bg-[var(--navy-shell)] px-2.5 py-1.5 font-mono text-xs font-semibold text-white underline-offset-4 hover:opacity-90"
          >
            {technician.workshopCode}
          </Link>
          <span className="ms-auto text-xs text-muted-foreground">
            {t("profile.addedOn", { date: formatDateUtc(technician.createdAtUtc) })}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t("technicians.identitySection")}
            </h2>
            <dl className="mt-3 grid grid-cols-[minmax(7rem,9rem)_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("technicians.nationalId")}</dt>
              <dd className="font-mono tabular-nums text-[var(--navy)]" dir="ltr">
                {technician.nationalId}
              </dd>
              <dt className="text-muted-foreground">{t("profile.contactMobile")}</dt>
              <dd className="tabular-nums text-[var(--navy)]" dir="ltr">
                {technician.mobile}
              </dd>
            </dl>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t("technicians.workSection")}
            </h2>
            <dl className="mt-3 grid grid-cols-[minmax(7rem,9rem)_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t("technicians.workshop")}</dt>
              <dd>
                <Link
                  href={`/workshops/${technician.workshopId}`}
                  className="font-mono text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {technician.workshopCode}
                </Link>
              </dd>
              {technician.specialty ? (
                <>
                  <dt className="text-muted-foreground">{t("technicians.specialty")}</dt>
                  <dd>{technician.specialty}</dd>
                </>
              ) : null}
              <dt className="text-muted-foreground">{t("technicians.years")}</dt>
              <dd className="tabular-nums font-semibold text-[var(--navy)]">
                {technician.yearsOfExperience}
              </dd>
            </dl>
          </div>
        </div>

        {technician.notes ? (
          <div className="border-t pt-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t("profile.notes")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{technician.notes}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {t("technicians.trainingSoon")}
      </section>

      <TechnicianDialog open={editOpen} onOpenChange={setEditOpen} technician={technician} />
    </div>
  );
}
