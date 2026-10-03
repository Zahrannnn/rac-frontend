"use client";

import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { Workshop, WorkshopSurvey } from "@/features/workshops/types";
import type { SurveyStatusEntry } from "../hooks/use-workshop-surveys";
import { surveyActionLabelKey, SurveyStatusSlot } from "./SurveyStatusSlot";

function SurveyMobileCard({
  workshop,
  survey,
  surveyPending,
  onOpen,
}: {
  workshop: Workshop;
  survey: WorkshopSurvey | null;
  surveyPending: boolean;
  onOpen: () => void;
}) {
  const t = useT();
  const title = workshop.nameAr || workshop.nameEn;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full flex-col gap-3 rounded-lg border bg-card p-4 text-start transition-colors duration-150 hover:bg-[var(--row-selected)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--navy)]">{title}</p>
          <p className="mt-0.5 font-mono text-xs font-semibold text-primary">{workshop.code}</p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[var(--secondary)] rtl:rotate-180" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SurveyStatusSlot survey={survey} surveyPending={surveyPending} />
        <span className="text-xs text-muted-foreground">{workshop.governorate}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {survey
            ? t("survey.photoCountShort", { count: survey.photoCount })
            : t("survey.openToStart")}
        </span>
        <span className="font-medium text-primary">{t(surveyActionLabelKey(survey))}</span>
      </div>
      <span className="sr-only">{t("survey.openWizard")}</span>
    </button>
  );
}

/** The workshop queue itself — mobile cards plus the desktop table, one row per workshop. */
export function SurveyQueue({
  rows,
  surveysMap,
  openWizard,
}: {
  rows: Workshop[];
  surveysMap: Map<string, SurveyStatusEntry>;
  openWizard: (workshopId: string) => void;
}) {
  const t = useT();

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((workshop) => {
          const entry = surveysMap.get(workshop.id);
          return (
            <li key={workshop.id}>
              <SurveyMobileCard
                workshop={workshop}
                survey={entry?.survey ?? null}
                surveyPending={entry?.isPending ?? false}
                onOpen={() => openWizard(workshop.id)}
              />
            </li>
          );
        })}
      </ul>

      <div className="hidden rounded-lg border bg-card md:block">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 w-[8.5rem] bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("survey.workshopCode")}
              </TableHead>
              <TableHead className="h-11 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("workshops.colName")}
              </TableHead>
              <TableHead className="h-11 w-[8rem] bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("workshops.colGovernorate")}
              </TableHead>
              <TableHead className="h-11 w-[7.5rem] bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("survey.statusFilter")}
              </TableHead>
              <TableHead className="h-11 w-[5rem] bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("survey.photoCount")}
              </TableHead>
              <TableHead className="h-11 w-[7rem] bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white">
                {t("survey.action")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((workshop) => {
              const entry = surveysMap.get(workshop.id);
              const survey = entry?.survey ?? null;
              return (
                <TableRow
                  key={workshop.id}
                  tabIndex={0}
                  className="h-12 cursor-pointer focus-visible:bg-[var(--row-selected)]"
                  onClick={() => openWizard(workshop.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openWizard(workshop.id);
                    }
                  }}
                >
                  <TableCell>
                    <span className="rounded-md bg-[var(--navy-shell)] px-2 py-1 font-mono text-[0.65rem] font-semibold text-white">
                      {workshop.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block font-medium text-[var(--navy)]">
                      {workshop.nameAr || workshop.nameEn}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {workshop.governorate}
                  </TableCell>
                  <TableCell>
                    <SurveyStatusSlot survey={survey} surveyPending={entry?.isPending ?? false} />
                  </TableCell>
                  <TableCell className="tabular-nums font-semibold text-[var(--navy)]">
                    {survey ? survey.photoCount : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        survey?.status === "Incomplete" ? "text-[#8a5a14]" : "text-primary"
                      )}
                    >
                      {t(surveyActionLabelKey(survey))}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
