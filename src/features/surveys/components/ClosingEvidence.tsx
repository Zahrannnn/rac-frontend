"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationMapLazy } from "@/shared/components/map";
import { useT } from "@/shared/i18n";
import { parseMapsUrl } from "@/shared/utils/parse-maps-url";
import type { SurveyRecord } from "../types";
import { PhotoUploader } from "./PhotoUploader";

/**
 * Closing field evidence — GPS capture with an editable map confirmation plus
 * the docs photos block, shown on the last walkable closing field (before the
 * section PUT). A pasted Google Maps link (or bare "lat,lng") can set the
 * location: on success it rides the SAME saveGps pipeline (world-range reject
 * → Egypt warn → recordGps), so validation, warnings and the map pin behave
 * identically; on failure an inline error appears with no state change.
 */
export function ClosingEvidence({
  survey,
  onSaveGps,
  onCaptureGps,
  isCapturing,
  photosHidden = false,
}: {
  survey: SurveyRecord;
  onSaveGps: (latitude: number, longitude: number) => void;
  onCaptureGps: () => void;
  isCapturing: boolean;
  /** Owner refused documentation photos — the uploader disappears. */
  photosHidden?: boolean;
}) {
  const t = useT();
  const [mapsLink, setMapsLink] = useState("");
  const [mapsLinkInvalid, setMapsLinkInvalid] = useState(false);
  const gpsRecorded =
    survey.latitude !== null && survey.longitude !== null && survey.gpsRecordedAtUtc !== null;

  function applyMapsLink() {
    const coords = parseMapsUrl(mapsLink);
    if (!coords) {
      setMapsLinkInvalid(true);
      return;
    }
    setMapsLinkInvalid(false);
    onSaveGps(coords.latitude, coords.longitude);
  }

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
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  dir="ltr"
                  className="min-h-11 w-full sm:max-w-sm"
                  placeholder={t("wizard.gpsLinkPlaceholder")}
                  aria-label={t("wizard.gpsLinkLabel")}
                  value={mapsLink}
                  onChange={(event) => {
                    setMapsLink(event.target.value);
                    setMapsLinkInvalid(false);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyMapsLink}
                  disabled={isCapturing}
                >
                  {t("wizard.gpsFromLink")}
                </Button>
              </div>
              {mapsLinkInvalid ? (
                <p className="text-xs text-destructive" role="alert">
                  {t("wizard.gpsLinkInvalid")}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
      {photosHidden ? null : (
        <PhotoUploader surveyId={survey.id} sectionKey="closing" label={t("survey.docsPhotos")} />
      )}
    </>
  );
}
