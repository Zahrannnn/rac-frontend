"use client";

// Leaflet CSS must load with the map bundle; importing from the package keeps
// the version in lockstep (verified not to clash with the Tailwind build).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { MapContainer } from "./map-container";
import { ScrollZoomGate } from "./map-widgets";
import { createPinIcon } from "./pin-icon";
import { useT } from "@/shared/i18n";

export type LocationMapProps = {
  lat: number;
  lon: number;
  /** Editable = draggable pin writing back through onChange (wizard confirmation). */
  editable?: boolean;
  onChange?: (lat: number, lon: number) => void;
  /** Label shown in the pin popup (e.g. workshop name). */
  label?: string;
  height?: number;
};

function DraggableMarker({
  lat,
  lon,
  onChange,
}: {
  lat: number;
  lon: number;
  onChange: (lat: number, lon: number) => void;
}) {
  const t = useT();
  const icon = useMemo(() => createPinIcon(), []);

  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const { lat: newLat, lng: newLon } = (event.target as L.Marker).getLatLng();
          onChange(Number(newLat.toFixed(6)), Number(newLon.toFixed(6)));
        },
      }}
    >
      <Popup>{t("map.dragHint")}</Popup>
    </Marker>
  );
}

function StaticMarker({ lat, lon, label }: { lat: number; lon: number; label?: string }) {
  const icon = useMemo(() => createPinIcon(), []);

  return (
    <Marker position={[lat, lon]} icon={icon}>
      {label ? <Popup>{label}</Popup> : null}
    </Marker>
  );
}

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    // Smooth pan when the pin moves (GPS capture, manual entry, drag) without
    // resetting a zoom level the user chose.
    map.flyTo([lat, lon]);
  }, [lat, lon, map]);
  return null;
}

/**
 * OpenStreetMap pin view (CONTEXT.md decision 10b — embed-only, no navigation,
 * no Google API). Must be rendered client-only via location-map-lazy.
 */
export default function LocationMap({
  lat,
  lon,
  editable = false,
  onChange,
  label,
  height = 280,
}: LocationMapProps) {
  return (
    <div
      className="relative isolate z-0 overflow-hidden rounded-lg border [&_.leaflet-container]:bg-background"
      style={{ height }}
      dir="ltr"
    >
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina
        />
        <Recenter lat={lat} lon={lon} />
        <ScrollZoomGate />
        {editable && onChange ? (
          <DraggableMarker lat={lat} lon={lon} onChange={onChange} />
        ) : (
          <StaticMarker lat={lat} lon={lon} label={label} />
        )}
      </MapContainer>
    </div>
  );
}
