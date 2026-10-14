"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink, MapPin } from "lucide-react";
import { LocationMapLazy } from "@/shared/components/map";
import { useT } from "@/shared/i18n";
import { formatCoords, googleMapsUrl } from "../utils/geo";
import { parseOptionalNumber } from "../utils/number-input";
import { useLocationDraft } from "../hooks/use-location-draft";

/**
 * Profile location card: OSM pin map when coordinates exist, GPS capture /
 * manual entry when the user can edit. Backend PATCH accepts lat/lon pairs.
 * Draft/warning/save state lives in useLocationDraft.
 */
export function LocationCard({
  workshopId,
  latitude,
  longitude,
  label,
  canEdit = false,
}: {
  workshopId: string;
  latitude: number | null;
  longitude: number | null;
  label: string;
  canEdit?: boolean;
}) {
  const t = useT();
  const {
    update,
    copied,
    gpsState,
    draftLat,
    draftLon,
    pairError,
    duplicateRetry,
    savedHasCoords,
    draftHasCoords,
    dirty,
    updateDraft,
    copyCoords,
    captureGps,
    save,
    resetDraft,
  } = useLocationDraft(workshopId, latitude, longitude);

  return (
    <section className="rounded-lg border bg-card p-4 text-start">
      <h2 className="text-sm font-semibold text-[var(--navy)]">{t("map.locationCard")}</h2>

      {canEdit ? (
        <div className="mt-3 rounded-md border bg-[color-mix(in_oklab,var(--brand-blue)_5%,white)] p-4">
          <p className="text-sm font-semibold text-[var(--navy)]">{t("wizard.gps")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("wizard.gpsHint")}</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workshop-lat">{t("wizard.lat")}</Label>
              <Input
                id="workshop-lat"
                className="w-36 tabular-nums"
                value={draftLat ?? ""}
                onChange={(event) => updateDraft({ latitude: parseOptionalNumber(event.target.value) })}
                inputMode="decimal"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workshop-lon">{t("wizard.lon")}</Label>
              <Input
                id="workshop-lon"
                className="w-36 tabular-nums"
                value={draftLon ?? ""}
                onChange={(event) => updateDraft({ longitude: parseOptionalNumber(event.target.value) })}
                inputMode="decimal"
                dir="ltr"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={captureGps}
              disabled={gpsState === "capturing" || update.isPending}
            >
              <MapPin data-icon="inline-start" />
              {gpsState === "capturing" ? t("wizard.capturingGps") : t("wizard.captureGps")}
            </Button>
            {gpsState === "captured" && draftHasCoords ? (
              <span className="text-sm font-medium text-[var(--success)]">
                {t("wizard.gpsCaptured")}
              </span>
            ) : null}
          </div>
          {pairError ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {pairError}
            </p>
          ) : null}
          {duplicateRetry ? (
            <p className="mt-2 text-sm text-[var(--warning)]" role="status">
              {t("duplicate.conflictRetry")}
            </p>
          ) : null}
          {dirty ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={update.isPending}
                onClick={() => save(duplicateRetry)}
              >
                {update.isPending
                  ? t("profile.saving")
                  : duplicateRetry
                    ? t("map.saveAnyway")
                    : t("map.saveLocation")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={update.isPending}
                onClick={resetDraft}
              >
                {t("profile.cancel")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {draftHasCoords ? (
        <div className="mt-3 flex flex-col gap-3">
          <LocationMapLazy
            lat={draftLat!}
            lon={draftLon!}
            label={label}
            height={260}
            editable={canEdit}
            onChange={
              canEdit
                ? (newLat, newLon) => {
                    updateDraft({ latitude: newLat, longitude: newLon });
                  }
                : undefined
            }
          />
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="tabular-nums" dir="ltr">
              {formatCoords(draftLat!, draftLon!)}
            </span>
            {savedHasCoords || !dirty ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={copyCoords}>
                  <Copy data-icon="inline-start" className="h-4 w-4" />
                  {copied ? t("map.coordsCopied") : t("map.copyCoords")}
                </Button>
                <a
                  href={googleMapsUrl(draftLat!, draftLon!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("map.openGoogleMaps")}
                </a>
              </>
            ) : null}
          </div>
        </div>
      ) : !canEdit ? (
        <div className="mt-3 flex flex-col items-center gap-2 rounded-md bg-muted p-6 text-center">
          <MapPin className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">{t("map.noCoordinates")}</p>
          <p className="text-xs text-muted-foreground">{t("map.noCoordinatesHint")}</p>
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
          {t("map.noCoordinatesHint")}
        </p>
      )}
    </section>
  );
}
