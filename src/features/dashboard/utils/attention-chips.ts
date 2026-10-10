import type { Route } from "next";
import { routes } from "@/shared/constants/routes";
import type { TranslationKey } from "@/shared/i18n";
import type { AssignedDashboardAttention, DashboardAttention, SurveySummaryBrief } from "../types";

export type AttentionChipKey =
  | "incompleteFailing"
  | "stuckDrafts"
  | "awaitingSelectionCount";

export type AttentionChip = {
  key: AttentionChipKey;
  count: number;
  labelKey: TranslationKey;
  href: Route;
  tone: "warning" | "danger" | "info";
};

/** First Incomplete survey with failing rules — anchor for the wizard-review deep link. */
function firstFailingSurveyWorkshopId(
  surveyBriefs: SurveySummaryBrief[] | undefined
): string | null {
  const failing = surveyBriefs?.find(
    (s) => s.status === "Incomplete" && s.failingRules > 0
  );
  return failing?.workshopId ?? null;
}

/**
 * Build visible attention chips. Every chip deep-links to its exact surface:
 * failing survey → the workshop's survey wizard review step (needs the survey briefs;
 * falls back to the filtered surveys list), stuck drafts / Complete surveys awaiting a
 * selection run → the filtered registry.
 */
export function buildAttentionChips(
  attention: DashboardAttention | AssignedDashboardAttention,
  options?: {
    includeOfficeChips?: boolean;
    surveyBriefs?: SurveySummaryBrief[];
  }
): AttentionChip[] {
  const includeOffice = options?.includeOfficeChips ?? "stuckDrafts" in attention;
  const surveyBriefs = options?.surveyBriefs;
  const chips: AttentionChip[] = [];

  if (attention.incompleteFailing > 0) {
    const failingWorkshopId = firstFailingSurveyWorkshopId(surveyBriefs);
    chips.push({
      key: "incompleteFailing",
      count: attention.incompleteFailing,
      labelKey: "dashboard.attention.incompleteFailing",
      href: failingWorkshopId
        ? (`/workshops/${failingWorkshopId}/survey?step=review` as Route)
        : (routes.surveys as Route),
      tone: "warning",
    });
  }

  if (includeOffice && "stuckDrafts" in attention && attention.stuckDrafts > 0) {
    chips.push({
      key: "stuckDrafts",
      count: attention.stuckDrafts,
      labelKey: "dashboard.attention.stuckDrafts",
      href: `${routes.workshops}?status=Draft` as Route,
      tone: "warning",
    });
  }

  if (includeOffice && "awaitingSelectionCount" in attention && attention.awaitingSelectionCount > 0) {
    chips.push({
      key: "awaitingSelectionCount",
      count: attention.awaitingSelectionCount,
      labelKey: "dashboard.attention.awaitingSelectionCount",
      href: `${routes.workshops}?status=Complete` as Route,
      tone: "info",
    });
  }

  return chips;
}
