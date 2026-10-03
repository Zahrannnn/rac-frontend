"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapContainer } from "./map-container";
import { MapToolbar, ScaleBar, ScrollZoomGate } from "./map-widgets";
import { createPinIcon } from "./pin-icon";

/** Egypt mainland default view when there are no pins yet. */
const EGYPT_CENTER: [number, number] = [26.8, 30.8];
const EGYPT_ZOOM = 6;
/** Egypt-only program — zooming out past this loses all context. */
const MIN_ZOOM = 5;

export type WorkshopsMapMarker = {
  id: string;
  lat: number;
  lon: number;
  /** Primary popup line (workshop name). */
  title: string;
  /** Secondary popup line (code / status). */
  subtitle?: string;
  href?: string;
  linkLabel?: string;
};

export type WorkshopsMapProps = {
  markers: WorkshopsMapMarker[];
  height?: number;
};

function FitMarkers({ markers }: { markers: WorkshopsMapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      map.flyTo(EGYPT_CENTER, EGYPT_ZOOM);
      return;
    }
    if (markers.length === 1) {
      map.flyTo([markers[0].lat, markers[0].lon], 12);
      return;
    }
    const bounds = L.latLngBounds(markers.map((marker) => [marker.lat, marker.lon]));
    map.flyToBounds(bounds, { padding: [28, 28], maxZoom: 12, duration: 0.8 });
  }, [map, markers]);

  return null;
}

/**
 * Multi-pin OpenStreetMap view for dashboard / registry geography
 * (CONTEXT.md decision 10b — embed-only).
 */
export default function WorkshopsMap({ markers, height = 360 }: WorkshopsMapProps) {
  const icon = useMemo(() => createPinIcon(), []);

  return (
    <div
      className="relative isolate z-0 overflow-hidden rounded-lg border [&_.leaflet-container]:bg-background"
      style={{ height }}
      dir="ltr"
    >
      <MapContainer
        center={EGYPT_CENTER}
        zoom={EGYPT_ZOOM}
        minZoom={MIN_ZOOM}
        worldCopyJump
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina
        />
        <FitMarkers markers={markers} />
        <ScaleBar />
        <MapToolbar />
        <ScrollZoomGate />
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lon]} icon={icon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{marker.title}</p>
                {marker.subtitle ? (
                  <p className="text-xs text-muted-foreground">{marker.subtitle}</p>
                ) : null}
                {marker.href ? (
                  <a
                    href={marker.href}
                    className="mt-1 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {marker.linkLabel ?? "Open"}
                  </a>
                ) : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
