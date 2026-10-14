"use client";

import { ChevronRight } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/shared/components/data-table/data-table";
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

  // Server-paged (rides on the workshops list) — fixed API order, no client sorting.
  const columns: DataTableColumn<Workshop>[] = [
    {
      key: "code",
      header: t("survey.workshopCode"),
      className: "w-[8.5rem]",
      cell: (workshop) => (
        <span className="rounded-md bg-[var(--navy-shell)] px-2 py-1 font-mono text-[0.65rem] font-semibold text-white">
          {workshop.code}
        </span>
      ),
    },
    {
      key: "name",
      header: t("workshops.colName"),
      cell: (workshop) => (
        <span className="block font-medium text-[var(--navy)]">
          {workshop.nameAr || workshop.nameEn}
        </span>
      ),
    },
    {
      key: "governorate",
      header: t("workshops.colGovernorate"),
      className: "w-[8rem]",
      cell: (workshop) => (
        <span className="text-sm text-muted-foreground">{workshop.governorate}</span>
      ),
    },
    {
      key: "status",
      header: t("survey.statusFilter"),
      className: "w-[7.5rem]",
      cell: (workshop) => {
        const entry = surveysMap.get(workshop.id);
        return (
          <SurveyStatusSlot
            survey={entry?.survey ?? null}
            surveyPending={entry?.isPending ?? false}
          />
        );
      },
    },
    {
      key: "photos",
      header: t("survey.photoCount"),
      className: "w-[5rem]",
      cell: (workshop) => {
        const survey = surveysMap.get(workshop.id)?.survey ?? null;
        return (
          <span className="tabular-nums font-semibold text-[var(--navy)]">
            {survey ? survey.photoCount : "—"}
          </span>
        );
      },
    },
    {
      key: "action",
      header: t("survey.action"),
      className: "w-[7rem]",
      cell: (workshop) => {
        const survey = surveysMap.get(workshop.id)?.survey ?? null;
        return (
          <span
            className={cn(
              "text-xs font-semibold",
              survey?.status === "Incomplete" ? "text-[#8a5a14]" : "text-primary"
            )}
          >
            {t(surveyActionLabelKey(survey))}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(workshop) => workshop.id}
      ariaLabel={t("survey.queueTitle")}
      onRowClick={(workshop) => openWizard(workshop.id)}
      emptyState={{ title: t("survey.queueEmpty"), hint: t("survey.queueEmptyHint") }}
      mobileCard={(workshop) => {
        const entry = surveysMap.get(workshop.id);
        return (
          <SurveyMobileCard
            workshop={workshop}
            survey={entry?.survey ?? null}
            surveyPending={entry?.isPending ?? false}
            onOpen={() => openWizard(workshop.id)}
          />
        );
      }}
    />
  );
}
