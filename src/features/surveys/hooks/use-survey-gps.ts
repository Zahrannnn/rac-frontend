"use client";

import { toast } from "sonner";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { useT } from "@/shared/i18n";
import {
  isOutsideEgypt,
  WORLD_LATITUDE_MAX,
  WORLD_LATITUDE_MIN,
  WORLD_LONGITUDE_MAX,
  WORLD_LONGITUDE_MIN,
} from "@/shared/validation/constants";
import { useRecordGps } from "./use-survey";

/**
 * GPS field evidence: capture + editable map confirmation, saved to the survey
 * record immediately. Backend contract mirrored: world-impossible coordinates
 * are rejected (400); outside-Egypt coordinates save but warn — non-blocking
 * field evidence (audit 1.3).
 */
export function useSurveyGps(surveyId: string, workshopId: string) {
  const t = useT();
  const recordGps = useRecordGps(surveyId, workshopId);
  const geolocation = useGeolocationCapture();

  function saveGps(latitude: number, longitude: number) {
    if (
      latitude < WORLD_LATITUDE_MIN ||
      latitude > WORLD_LATITUDE_MAX ||
      longitude < WORLD_LONGITUDE_MIN ||
      longitude > WORLD_LONGITUDE_MAX
    ) {
      toast.error(t("wizard.gpsInvalid"));
      return;
    }
    if (isOutsideEgypt(latitude, longitude)) {
      toast.warning(t("wizard.gpsOutOfRange"));
    }
    recordGps.mutate(
      { latitude, longitude },
      {
        onSuccess: () => toast.success(t("wizard.gpsCaptured")),
        onError: () => toast.error(`${t("common.error")} — ${t("common.retry")}`),
      }
    );
  }

  function captureGps() {
    geolocation.capture({
      onPosition: saveGps,
    });
  }

  return { saveGps, captureGps, isCapturing: recordGps.isPending };
}
