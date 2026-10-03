"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/shared/i18n";

export type GeolocationStatus = "idle" | "capturing" | "captured";

type CaptureCallbacks = {
  /** Called with 6-dp rounded coordinates once the browser reports a position. */
  onPosition: (latitude: number, longitude: number) => void;
};

/**
 * Shared browser-geolocation state machine (idle → capturing → captured).
 * Owns the availability/secure-context guards and the permission-denied /
 * unavailable toast mapping; callers only handle the resulting coordinates.
 */
export function useGeolocationCapture() {
  const t = useT();
  const [status, setStatus] = useState<GeolocationStatus>("idle");

  const capture = useCallback(
    ({ onPosition }: CaptureCallbacks) => {
      if (status === "capturing") {
        return;
      }
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        toast.error(t("wizard.gpsUnavailable"));
        return;
      }
      if (!window.isSecureContext) {
        toast.error(t("wizard.gpsInsecure"));
        return;
      }

      setStatus("capturing");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude.toFixed(6));
          const longitude = Number(position.coords.longitude.toFixed(6));
          setStatus("captured");
          onPosition(latitude, longitude);
          toast.success(t("wizard.gpsCaptured"));
        },
        (error) => {
          setStatus("idle");
          toast.error(
            error.code === error.PERMISSION_DENIED
              ? t("wizard.gpsDenied")
              : t("wizard.gpsUnavailable")
          );
        },
        { enableHighAccuracy: true, timeout: 15_000 }
      );
    },
    [status, t]
  );

  const reset = useCallback(() => {
    setStatus("idle");
  }, []);

  return { status, capture, reset };
}
