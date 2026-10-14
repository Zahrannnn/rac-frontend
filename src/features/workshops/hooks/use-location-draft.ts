"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useGeolocationCapture } from "@/shared/hooks/use-geolocation";
import { useT } from "@/shared/i18n";
import { useUpdateWorkshop } from "./use-workshops";
import { coordinatePairError, formatCoords, hasCoordinates } from "../utils/geo";

/**
 * The profile location card's editor state: a draft lat/lon seeded from the
 * saved workshop, transient pair/duplicate warnings cleared on every edit,
 * GPS capture, and the PATCH save with the backend 409 confirm-duplicate
 * retry flow. Re-seeds whenever the saved coordinates change.
 */
export function useLocationDraft(
  workshopId: string,
  latitude: number | null,
  longitude: number | null
) {
  const t = useT();
  const update = useUpdateWorkshop(workshopId);
  const [copied, setCopied] = useState(false);
  const geolocation = useGeolocationCapture();
  const gpsState = geolocation.status;
  const [draftLat, setDraftLat] = useState<number | null>(latitude);
  const [draftLon, setDraftLon] = useState<number | null>(longitude);
  const [pairError, setPairError] = useState<string | null>(null);
  const [duplicateRetry, setDuplicateRetry] = useState(false);

  // Every draft edit invalidates the transient pair/duplicate warnings.
  function clearDraftWarnings() {
    setPairError(null);
    setDuplicateRetry(false);
  }

  // Re-seed the draft when the saved coordinates change (render-time adjustment).
  const [prevSaved, setPrevSaved] = useState<[number | null, number | null]>([latitude, longitude]);
  if (prevSaved[0] !== latitude || prevSaved[1] !== longitude) {
    setPrevSaved([latitude, longitude]);
    setDraftLat(latitude);
    setDraftLon(longitude);
    clearDraftWarnings();
    geolocation.reset();
  }

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const savedHasCoords = hasCoordinates(latitude, longitude);
  const draftHasCoords = hasCoordinates(draftLat, draftLon);
  const dirty = draftLat !== latitude || draftLon !== longitude;

  /** Draft edit: merge lat/lon and clear the transient warnings. */
  function updateDraft(patch: { latitude?: number | null; longitude?: number | null }) {
    if (patch.latitude !== undefined) {
      setDraftLat(patch.latitude);
    }
    if (patch.longitude !== undefined) {
      setDraftLon(patch.longitude);
    }
    clearDraftWarnings();
  }

  async function copyCoords() {
    if (!hasCoordinates(draftLat, draftLon)) return;
    try {
      await navigator.clipboard.writeText(formatCoords(draftLat!, draftLon!));
      setCopied(true);
      toast.success(t("map.coordsCopied"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  function captureGps() {
    geolocation.capture({
      onPosition: (latitude, longitude) => {
        setDraftLat(latitude);
        setDraftLon(longitude);
        clearDraftWarnings();
      },
    });
  }

  function save(confirmDuplicate: boolean) {
    const invalidPairMessage = coordinatePairError(draftLat, draftLon);
    if (invalidPairMessage) {
      setPairError(t(invalidPairMessage));
      return;
    }
    setPairError(null);

    update.mutate(
      {
        latitude: draftLat,
        longitude: draftLon,
        confirmDuplicate,
      },
      {
        onSuccess: () => {
          setDuplicateRetry(false);
          geolocation.reset();
          toast.success(t("profile.saved"));
        },
        onError: (error) => {
          if ((error as { status?: number }).status === 409) {
            if (!confirmDuplicate) {
              setDuplicateRetry(true);
              toast.warning(t("duplicate.conflictRetry"));
            } else {
              toast.warning(t("duplicate.conflict"));
            }
          } else if ((error as { status?: number }).status !== 403) {
            toast.error(`${t("common.error")} — ${t("common.retry")}`);
          }
        },
      }
    );
  }

  function resetDraft() {
    setDraftLat(latitude);
    setDraftLon(longitude);
    clearDraftWarnings();
    geolocation.reset();
  }

  return {
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
  };
}
