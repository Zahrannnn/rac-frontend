"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import type { Technician } from "../types";
import { TechnicianStatusBadge } from "./TechnicianStatusBadge";

const TABLE_HEAD_CLASS =
  "h-11 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white";

/** Desktop registry table — rows open the technician profile (click or Enter/Space). */
export function TechniciansTable({
  technicians,
  onOpen,
}: {
  technicians: Technician[];
  onOpen: (technician: Technician) => void;
}) {
  const t = useT();

  return (
    <div className="hidden rounded-lg border bg-card md:block">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={TABLE_HEAD_CLASS}>{t("technicians.fullName")}</TableHead>
            <TableHead className={`${TABLE_HEAD_CLASS} w-[9rem]`}>
              {t("technicians.nationalId")}
            </TableHead>
            <TableHead className={`${TABLE_HEAD_CLASS} w-[8rem]`}>
              {t("profile.contactMobile")}
            </TableHead>
            <TableHead className={`${TABLE_HEAD_CLASS} w-[8rem]`}>
              {t("technicians.workshop")}
            </TableHead>
            <TableHead className={`${TABLE_HEAD_CLASS} w-[5.5rem]`}>
              {t("technicians.years")}
            </TableHead>
            <TableHead className={`${TABLE_HEAD_CLASS} w-[6.5rem]`}>
              {t("technicians.status")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {technicians.map((technician) => (
            <TableRow
              key={technician.id}
              tabIndex={0}
              className="h-12 cursor-pointer focus-visible:bg-[var(--row-selected)]"
              onClick={() => onOpen(technician)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen(technician);
                }
              }}
            >
              <TableCell>
                <span className="block font-medium text-[var(--navy)]">
                  {technician.fullNameAr || technician.fullName}
                </span>
                {technician.specialty ? (
                  <span className="block text-xs text-muted-foreground">
                    {technician.specialty}
                  </span>
                ) : null}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums" dir="ltr">
                {technician.nationalId}
              </TableCell>
              <TableCell className="tabular-nums" dir="ltr">
                {technician.mobile}
              </TableCell>
              <TableCell className="font-mono text-xs font-semibold text-primary">
                {technician.workshopCode}
              </TableCell>
              <TableCell className="tabular-nums font-semibold text-[var(--navy)]">
                {technician.yearsOfExperience}
              </TableCell>
              <TableCell>
                <TechnicianStatusBadge status={technician.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
