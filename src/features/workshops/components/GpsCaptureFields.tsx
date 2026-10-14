"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/shared/components/form/form-field";
import { LocationMapLazy } from "@/shared/components/map";
import type { GeolocationStatus } from "@/shared/hooks/use-geolocation";
import { useT } from "@/shared/i18n";
import { parseOptionalNumber } from "../utils/number-input";

type CoordinatePatch = { latitude?: number | null; longitude?: number | null };

type GpsCaptureFieldsProps = {
  latitude: number | null;
  longitude: number | null;
  /** Merge a coordinate change into the caller's form state. */
  onPatch: (patch: CoordinatePatch) => void;
  gpsState: GeolocationStatus;
  onCapture: () => void;
  /** Extra disable condition for the capture button (e.g. while saving). */
  captureDisabled?: boolean;
  /** Visibility of the "GPS captured" confirmation (call site owns the rule). */
  showCaptured: boolean;
  latitudeError?: string;
  longitudeError?: string;
  /** Pair-level alert under the inputs (e.g. the wizard's latitude error). */
  pairAlert?: string;
  mapHeight?: number;
  /** Grid placement class for the wrapper (always spans the full row). */
  className?: string;
};

/**
 * GPS capture block shared by the registration wizard's location step and the
 * edit form: lat/lon inputs, capture button, captured confirmation, and the
 * editable OSM map (or the no-coordinates hint). Purely controlled — the
 * caller owns the form state and the save flow.
 */
export function GpsCaptureFields({
  latitude,
  longitude,
  onPatch,
  gpsState,
  onCapture,
  captureDisabled = false,
  showCaptured,
  latitudeError,
  longitudeError,
  pairAlert,
  mapHeight = 260,
  className = "",
}: GpsCaptureFieldsProps) {
  const t = useT();

  return (
    <div
      className={`${className} rounded-md border bg-[color-mix(in_oklab,var(--brand-blue)_5%,white)] p-4`}
    >
      <p className="text-sm font-semibold text-[var(--navy)]">{t("wizard.gps")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("wizard.gpsHint")}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <FormField label={t("wizard.lat")} error={latitudeError}>
          <Input
            className="w-36 tabular-nums"
            value={latitude ?? ""}
            onChange={(event) => onPatch({ latitude: parseOptionalNumber(event.target.value) })}
            inputMode="decimal"
            dir="ltr"
          />
        </FormField>
        <FormField label={t("wizard.lon")} error={longitudeError}>
          <Input
            className="w-36 tabular-nums"
            value={longitude ?? ""}
            onChange={(event) => onPatch({ longitude: parseOptionalNumber(event.target.value) })}
            inputMode="decimal"
            dir="ltr"
          />
        </FormField>
        <Button type="button" variant="secondary" onClick={onCapture} disabled={gpsState === "capturing" || captureDisabled}>
          <MapPin data-icon="inline-start" />
          {gpsState === "capturing" ? t("wizard.capturingGps") : t("wizard.captureGps")}
        </Button>
        {showCaptured ? (
          <span className="text-sm font-medium text-[var(--success)]">
            {t("wizard.gpsCaptured")}
          </span>
        ) : null}
      </div>
      {pairAlert ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {pairAlert}
        </p>
      ) : null}
      {latitude !== null && longitude !== null ? (
        <div className="mt-3">
          <LocationMapLazy
            lat={latitude}
            lon={longitude}
            editable
            onChange={(newLat, newLon) => onPatch({ latitude: newLat, longitude: newLon })}
            height={mapHeight}
          />
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {t("map.noCoordinatesHint")}
        </p>
      )}
    </div>
  );
}
