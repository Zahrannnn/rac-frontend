"use client";

import L from "leaflet";
import { Crosshair, Loader2, Maximize2, Minimize2, MousePointerClick } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMap, useMapEvents } from "react-leaflet";
import { useT } from "@/shared/i18n";

/**
 * Overlays rendered inside the Leaflet container (children of MapContainer).
 * They are absolutely positioned against the map div, which Leaflet keeps
 * position:relative. Leaflet listens for clicks on the container with native
 * listeners, so interactive overlays must call disableClickPropagation or
 * every button press also counts as a map click.
 */

const OVERLAY_Z = "z-[1000]";

/**
 * Scroll wheel stays disabled until the user clicks the map, so the embedded
 * map never hijacks page scrolling; a hint pill appears on hover while zoom
 * is still locked. Leaving the map re-locks it.
 */
export function ScrollZoomGate() {
  const t = useT();
  const [locked, setLocked] = useState(true);
  const [hovered, setHovered] = useState(false);

  const map = useMapEvents({
    click: () => {
      map.scrollWheelZoom.enable();
      setLocked(false);
    },
    mouseover: () => setHovered(true),
    mouseout: () => {
      map.scrollWheelZoom.disable();
      setLocked(true);
      setHovered(false);
    },
  });

  if (!locked || !hovered) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-3 ${OVERLAY_Z} flex justify-center px-4`}
    >
      <p
        dir="auto"
        className="flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-1 text-[0.8125rem] text-muted-foreground shadow-sm"
      >
        <MousePointerClick className="size-3.5 shrink-0" aria-hidden />
        {t("map.scrollHint")}
      </p>
    </div>
  );
}

/** Metric-only scale bar (Egypt context — imperial adds clutter). */
export function ScaleBar() {
  const map = useMap();

  useEffect(() => {
    const scale = L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    return () => {
      scale.remove();
    };
  }, [map]);

  return null;
}

const toolbarButton =
  "flex size-8 items-center justify-center rounded-md border border-border bg-background/95 text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

/**
 * Fullscreen toggle (Fullscreen API on the styled map wrapper, with
 * invalidateSize so Leaflet re-measures) and a "go to my location" button
 * that flies to the browser position and marks it with a native accuracy
 * circle. Both are opt-in actions; errors surface as toasts.
 */
export function MapToolbar() {
  const t = useT();
  const map = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const meLayersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement != null);
      // Leaflet measured the old viewport — recompute after the element is resized.
      window.setTimeout(() => map.invalidateSize(), 60);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [map]);

  useEffect(() => {
    return () => {
      // Hidden (Activity) trees keep the map alive — only drop the layers on a
      // real unmount, so the location dot survives navigating away and back.
      if (map.getContainer()?.isConnected) return;
      meLayersRef.current.forEach((layer) => layer.remove());
      meLayersRef.current = [];
    };
  }, [map]);

  const toggleFullscreen = () => {
    const target = map.getContainer().parentElement;
    if (target == null || !document.fullscreenEnabled) return;
    if (document.fullscreenElement == null) {
      void target.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  const removeMeLayers = () => {
    meLayersRef.current.forEach((layer) => layer.remove());
    meLayersRef.current = [];
  };

  const locateMe = () => {
    if (isLocating) return;
    if (typeof window === "undefined" || !("geolocation" in navigator) || !window.isSecureContext) {
      toast.error(t("map.locateUnavailable"));
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        removeMeLayers();

        const latlng = L.latLng(position.coords.latitude, position.coords.longitude);
        // Interaction blue (#0072A8) distinguishes "me" from workshop pins.
        const dot = L.circleMarker(latlng, {
          radius: 7,
          color: "#ffffff",
          weight: 2,
          fillColor: "#0072A8",
          fillOpacity: 1,
        });
        const accuracy = L.circle(latlng, {
          radius: position.coords.accuracy,
          weight: 1,
          color: "#0072A8",
          opacity: 0.5,
          fillColor: "#0072A8",
          fillOpacity: 0.12,
        });
        accuracy.addTo(map);
        dot.addTo(map);
        meLayersRef.current = [accuracy, dot];
        map.flyTo(latlng, Math.max(map.getZoom(), 13));
      },
      (error) => {
        setIsLocating(false);
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? t("map.locatePermissionDenied")
            : t("map.locateUnavailable")
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <div
      className={`absolute top-3 end-3 ${OVERLAY_Z} flex flex-col gap-1`}
      ref={(node) => {
        if (node != null) L.DomEvent.disableClickPropagation(node);
      }}
    >
      <button
        type="button"
        className={toolbarButton}
        onClick={locateMe}
        disabled={isLocating}
        aria-label={t("map.locate")}
        title={t("map.locate")}
      >
        {isLocating ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Crosshair className="size-4" aria-hidden />
        )}
      </button>
      <button
        type="button"
        className={toolbarButton}
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? t("map.exitFullscreen") : t("map.fullscreen")}
        title={isFullscreen ? t("map.exitFullscreen") : t("map.fullscreen")}
      >
        {isFullscreen ? (
          <Minimize2 className="size-4" aria-hidden />
        ) : (
          <Maximize2 className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
