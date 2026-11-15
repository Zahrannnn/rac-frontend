"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { MapContainer } from "@/shared/components/map/map-container";
import { MapToolbar, ScaleBar, ScrollZoomGate } from "@/shared/components/map/map-widgets";
import { useI18n, useT } from "@/shared/i18n";
import type { GasConsumptionRow } from "../types";
import {
  GAS_CONSUMPTION_BANDS,
  gasBandIndex,
  formatGasKg,
  gasDesignation,
  gasPinSvg,
  gasRowName,
} from "../utils/gas-consumption";

/** Egypt mainland default view (the shared map's convention). */
const EGYPT_CENTER: [number, number] = [26.8, 30.8];
const EGYPT_ZOOM = 6;
const MIN_ZOOM = 5;

function FitMarkers({ rows }: { rows: GasConsumptionRow[] }) {
  const map = useMap();

  useEffect(() => {
    if (rows.length === 0) {
      map.setView(EGYPT_CENTER, EGYPT_ZOOM);
      return;
    }
    const bounds = L.latLngBounds(rows.map((row) => [row.latitude!, row.longitude!]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
  }, [map, rows]);

  return null;
}

/**
 * The leaflet portion of the annual gas consumption map (REGISTRY-GAS-SPEC §6):
 * one pin per located workshop, color/size by the established consumption bands,
 * popup with name + code + annualTotalKg + per-gas lines. Loaded client-only via
 * next/dynamic (Leaflet must not SSR — the same isolation as WorkshopsMapLazy).
 */
export default function GasConsumptionMap({ rows }: { rows: GasConsumptionRow[] }) {
  const t = useT();
  const { locale } = useI18n();

  // One divIcon per band — heaviest band = largest/darkest pin.
  const bandIcons = useMemo(
    () =>
      GAS_CONSUMPTION_BANDS.map((_, band) => {
        const { svg, size, anchor } = gasPinSvg(band);
        return L.divIcon({
          html: svg,
          className: "rac-map-pin",
          iconSize: size,
          iconAnchor: [anchor[0], anchor[1]],
          popupAnchor: [0, -Math.round(anchor[1]) + 4],
        });
      }),
    []
  );

  return (
    <div
      className="relative isolate z-0 overflow-hidden rounded-lg border [&_.leaflet-container]:bg-background"
      style={{ height: 460 }}
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
        <FitMarkers rows={rows} />
        <ScaleBar />
        <MapToolbar />
        <ScrollZoomGate />
        {rows.map((row) => {
          const band = gasBandIndex(row.annualTotalKg);
          return (
            <Marker
              key={row.workshopId}
              position={[row.latitude!, row.longitude!]}
              icon={bandIcons[band]}
            >
              <Popup minWidth={230} maxWidth={320}>
                {/* §11 corrections: an ORGANIZED popup — fixed section order (size band →
                    annual total → per-gas breakdown), muted section labels above values,
                    and aligned per-gas rows (designation left, quantity right) instead of
                    an unpredictable comma blob. */}
                <div className="min-w-[210px] text-sm">
                  <p className="font-semibold leading-5 text-[var(--navy)]">
                    {gasRowName(row, locale)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {row.code}
                  </p>

                  {row.sizeClass ? (
                    <>
                      <div className="my-1.5 border-t" />
                      <p className="text-[11px] leading-4 text-muted-foreground">
                        {t("reports.mapSizeLabel")}
                      </p>
                      <p className="text-sm font-medium text-[var(--navy)]">
                        {locale === "ar" ? row.sizeClass.arabic : row.sizeClass.english}
                      </p>
                    </>
                  ) : null}

                  <div className="my-1.5 border-t" />
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    {t("reports.mapTotalLabel")}
                  </p>
                  <p className="text-base font-bold tabular-nums text-[var(--navy)]">
                    {formatGasKg(row.annualTotalKg)}{" "}
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("reports.mapUnit")}
                    </span>
                  </p>

                  {row.perGas.length > 0 ? (
                    <>
                      <div className="my-1.5 border-t" />
                      <p className="text-[11px] leading-4 text-muted-foreground">
                        {t("reports.mapPerGas")}
                      </p>
                      <ul className="space-y-0.5">
                        {row.perGas.map((gas) => (
                          <li
                            key={gas.gas}
                            className="flex items-baseline justify-between gap-4"
                          >
                            <span>{gasDesignation(gas.gas, t)}</span>
                            <span className="font-medium tabular-nums">
                              {formatGasKg(gas.quantityKg)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
