"use client";

import { Button } from "@/components/ui/button";
import { LocationMapLazy } from "@/shared/components/map";
import { useT } from "@/shared/i18n";
import type { SurveyRecord } from "../types";
import { PhotoUploader } from "./PhotoUploader";

/**
 * Closing field evidence — GPS capture with an editable map confirmation plus
 * the docs photos block, shown on the last walkable closing field (before the
 * section PUT). Outside-Egypt / world-impossible handling lives in the
 * wizard's saveGps callback.
 */
export function ClosingEvidence({
  survey,
  onSaveGps,
  onCaptureGps,
  isCapturing,
}: {
  survey: SurveyRecord;
  onSaveGps: (latitude: number, longitude: number) => void;
  onCaptureGps: () => void;
  isCapturing: boolean;
}) {
  const t = useT();
  const gpsRecorded =
    survey.latitude !== null && survey.longitude !== null && survey.gpsRecordedAtUtc !== null;

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border p-4">
        <p className="text-sm font-medium">{t("survey.gpsTitle")}</p>
        {gpsRecorded ? (
          <>
            <p className="text-sm text-[var(--success)]">{t("wizard.gpsCaptured")}</p>
            <LocationMapLazy
              lat={survey.latitude!}
              lon={survey.longitude!}
              editable
              onChange={onSaveGps}
              height={220}
            />
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t("survey.gpsMissing")}</p>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCaptureGps}
                disabled={isCapturing}
              >
                {isCapturing ? t("wizard.capturingGps") : t("wizard.captureGps")}
              </Button>
            </div>
          </>
        )}
      </div>
      <PhotoUploader surveyId={survey.id} sectionKey="closing" label={t("survey.docsPhotos")} />
    </>
  );
}
