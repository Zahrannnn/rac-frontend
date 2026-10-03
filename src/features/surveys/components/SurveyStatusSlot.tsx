"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/shared/i18n";
import type { WorkshopSurvey } from "@/features/workshops/types";
import { SurveyStatusBadge } from "./SurveyStatusBadge";

/** Registry status cell: pending skeleton, status badge, or the quiet "none" chip. */
export function SurveyStatusSlot({
  survey,
  surveyPending,
}: {
  survey: WorkshopSurvey | null;
  surveyPending: boolean;
}) {
  const t = useT();

  if (surveyPending) {
    return <Skeleton className="h-5 w-20 rounded-md" />;
  }
  if (survey) {
    return <SurveyStatusBadge status={survey.status} />;
  }
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      {t("survey.statusNone")}
    </span>
  );
}

/** Row action label — fix-up prompt for Incomplete, open/start otherwise. */
export function surveyActionLabelKey(survey: WorkshopSurvey | null) {
  if (survey?.status === "Incomplete") {
    return "survey.fixUp" as const;
  }
  return survey ? ("survey.openWizard" as const) : ("survey.start" as const);
}
