"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useT, type TranslationKey } from "@/shared/i18n";
import { routes } from "@/shared/constants/routes";
import { clearLastSectionKey } from "../utils/resume";
import type { SurveyRecord, SurveyStatus, ValidationEntry } from "../types";
import { useSubmitSurvey } from "./use-survey";

/**
 * Survey submission: flushes pending section saves first, then submits and
 * records the Complete/Incomplete outcome. 409 = survey went terminal
 * elsewhere (redirect out); 403 already toasts upstream.
 */
export function useSurveySubmit({
  survey,
  workshopId,
  flush,
}: {
  survey: SurveyRecord | undefined;
  workshopId: string;
  flush: () => Promise<boolean>;
}) {
  const router = useRouter();
  const t = useT();
  const submit = useSubmitSurvey(survey?.id ?? "", workshopId);
  const [submitResult, setSubmitResult] = useState<{
    status: SurveyStatus;
    validation: ValidationEntry[];
  } | null>(null);

  // 409 = survey went terminal elsewhere (redirect out); 403 already toasts upstream.
  function handleStepError(error: unknown, conflictToastKey: TranslationKey) {
    const status = (error as { status?: number }).status;
    if (status === 409) {
      toast.warning(t(conflictToastKey));
      router.push(`${routes.workshops}/${workshopId}`);
    } else if (status !== 403) {
      toast.error(`${t("common.error")} — ${t("common.retry")}`);
    }
  }

  async function handleSubmit() {
    if (!survey) {
      return;
    }
    const saved = await flush();
    if (!saved) {
      return; // save failed — error indicator is visible, answers kept for retry
    }
    submit.mutate(undefined as never, {
      onSuccess: (result) => {
        setSubmitResult({ status: result.status, validation: result.validation });
        if (result.status === "Complete") {
          clearLastSectionKey(survey.id);
          toast.success(t("survey.completeBanner"));
          setTimeout(() => router.push(`${routes.workshops}/${workshopId}`), 1600);
        } else {
          toast.warning(t("survey.incompleteToast"));
        }
      },
      onError: (error) => handleStepError(error, "survey.alreadySubmitted"),
    });
  }

  return {
    submit,
    submitResult,
    handleSubmit,
    clearSubmitResult: () => setSubmitResult(null),
  };
}
