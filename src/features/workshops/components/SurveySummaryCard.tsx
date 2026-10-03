"use client";

import Link from "next/link";
import type { Route } from "next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useT } from "@/shared/i18n";
import { racApi } from "@/shared/api/rac-api";
import { useMutation } from "@tanstack/react-query";
import { SurveyStatusBadge } from "@/features/surveys/components/SurveyStatusBadge";
import { useWorkshopSurvey } from "../hooks/use-workshops";
import { formatDateUtc } from "../utils/format";

/**
 * Survey summary on the workshop profile. "No survey" (404, incl.
 * existence-hiding) renders the calm empty state; the start button POSTs
 * /workshops/{id}/survey only for roles holding surveys:create. Non-complete
 * surveys deep-link into the wizard.
 */
export function SurveySummaryCard({
  workshopId,
  canStartSurvey,
}: {
  workshopId: string;
  canStartSurvey: boolean;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const { data: survey, isPending } = useWorkshopSurvey(workshopId);

  const startSurvey = useMutation({
    mutationFn: async () => {
      await racApi.post(`/workshops/${workshopId}/survey`);
    },
    onSuccess: () => {
      toast.success(t("survey.started"));
      void queryClient.invalidateQueries({ queryKey: ["workshops", "survey", workshopId] });
    },
    onError: (error) => {
      if ((error as { status?: number }).status !== 403) {
        toast.error(`${t("common.error")} — ${t("common.retry")}`);
      }
    },
  });

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--navy)]">{t("survey.cardTitle")}</h2>
        <Link
          href="/surveys"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("survey.openModule")}
        </Link>
      </div>

      {isPending ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : survey ? (
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <SurveyStatusBadge status={survey.status} />
            <span className="text-muted-foreground">
              {t("survey.photoCount")}:{" "}
              <span className="tabular-nums font-semibold text-[var(--navy)]">
                {survey.photoCount}
              </span>
            </span>
            {survey.submittedAtUtc ? (
              <span className="text-muted-foreground">
                {t("survey.submittedOn", { date: formatDateUtc(survey.submittedAtUtc) })}
              </span>
            ) : null}
          </div>
          {survey.status !== "Complete" ? (
            <div>
              <Button asChild size="sm" variant={survey.status === "Incomplete" ? "secondary" : "default"}>
                <Link href={`/workshops/${workshopId}/survey` as Route}>
                  {survey.status === "Incomplete"
                    ? t("survey.fixUp")
                    : t("survey.continueWizard")}
                </Link>
              </Button>
            </div>
          ) : (
            <Link
              href={`/workshops/${workshopId}/survey` as Route}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("survey.viewComplete")}
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <p className="text-muted-foreground">{t("survey.none")}</p>
          {canStartSurvey ? (
            <Button
              type="button"
              size="sm"
              disabled={startSurvey.isPending}
              onClick={() => startSurvey.mutate()}
            >
              {startSurvey.isPending ? t("survey.starting") : t("survey.start")}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
