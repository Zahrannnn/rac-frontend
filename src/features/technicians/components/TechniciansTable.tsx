"use client";

import { ChevronRight } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
import { useT } from "@/shared/i18n";
import type { Technician } from "../types";
import { TechnicianStatusBadge } from "./TechnicianStatusBadge";

function TechnicianMobileCard({
  technician,
  onOpen,
}: {
  technician: Technician;
  onOpen: () => void;
}) {
  const t = useT();
  const title = technician.fullNameAr || technician.fullName;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-start transition-colors duration-150 hover:bg-[var(--row-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--navy)]">{title}</p>
          {technician.specialty ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{technician.specialty}</p>
          ) : null}
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--secondary)] rtl:rotate-180" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TechnicianStatusBadge status={technician.status} />
        <span className="rounded-md bg-[var(--navy-shell)] px-2 py-0.5 font-mono text-[0.65rem] font-semibold text-white">
          {technician.workshopCode}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums" dir="ltr">
          {technician.mobile ?? "—"}
        </span>
        <span className="tabular-nums">
          {t("technicians.yearsShort", { count: technician.yearsOfExperience })}
        </span>
      </div>
      <span className="sr-only">{t("technicians.openTechnician")}</span>
    </button>
  );
}

/** Registry table — rows open the technician profile (click or Enter/Space); cards below md. */
export function TechniciansTable({
  technicians,
  onOpen,
}: {
  technicians: Technician[];
  onOpen: (technician: Technician) => void;
}) {
  const t = useT();

  // Server-paged registry: the API fixes the row order, so no sortValue —
  // sorting one page would mislead.
  const columns: DataTableColumn<Technician>[] = [
    {
      key: "name",
      header: t("technicians.fullName"),
      cell: (technician) => (
        <>
          <span className="block font-medium text-[var(--navy)]">
            {technician.fullNameAr || technician.fullName}
          </span>
          {technician.specialty ? (
            <span className="block text-xs text-muted-foreground">{technician.specialty}</span>
          ) : null}
        </>
      ),
    },
    {
      key: "nationalId",
      header: t("technicians.nationalId"),
      className: "w-[9rem]",
      cell: (technician) => (
        <span className="block font-mono text-xs tabular-nums" dir="ltr">
          {technician.nationalId ?? "—"}
        </span>
      ),
    },
    {
      key: "mobile",
      header: t("profile.contactMobile"),
      className: "w-[8rem]",
      cell: (technician) => (
        <span className="block tabular-nums" dir="ltr">
          {technician.mobile ?? "—"}
        </span>
      ),
    },
    {
      key: "workshop",
      header: t("technicians.workshop"),
      className: "w-[8rem]",
      cell: (technician) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {technician.workshopCode}
        </span>
      ),
    },
    {
      key: "years",
      header: t("technicians.years"),
      className: "w-[5.5rem]",
      cell: (technician) => (
        <span className="tabular-nums font-semibold text-[var(--navy)]">
          {technician.yearsOfExperience}
        </span>
      ),
    },
    {
      key: "status",
      header: t("technicians.status"),
      className: "w-[6.5rem]",
      cell: (technician) => <TechnicianStatusBadge status={technician.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={technicians}
      getRowId={(technician) => technician.id}
      ariaLabel={t("technicians.title")}
      onRowClick={onOpen}
      emptyState={{ title: t("technicians.empty"), hint: t("technicians.emptyHint") }}
      mobileCard={(technician) => (
        <TechnicianMobileCard technician={technician} onOpen={() => onOpen(technician)} />
      )}
    />
  );
}
