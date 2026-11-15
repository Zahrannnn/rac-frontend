import type { useT } from "@/shared/i18n";
import type { GasConsumptionRow } from "../types";

type TFunc = ReturnType<typeof useT>;

/** Official designation of a MAC gas key (REGISTRY-GAS-SPEC §6): R-134a,
 *  R-1234yf, and أخرى/Other for the "other" key. */
export function gasDesignation(gas: string, t: TFunc): string {
  if (gas === "other") {
    return t("reports.gasOther");
  }
  return gas === "r134a" ? "R-134a" : gas === "r1234yf" ? "R-1234yf" : gas;
}

/**
 * The established annual-consumption bands (REGISTRY-GAS-SPEC §6 — same
 * thresholds on both platforms): >1000, >501–1000, >251–500, >101–250,
 * >51–100, >0. Index 0 is the heaviest band (largest/darkest pin); every
 * positive total lands in exactly one band.
 */
export const GAS_CONSUMPTION_BANDS = [
  { min: 1000, label: ">1000" },
  { min: 500, label: "501–1000" },
  { min: 250, label: "251–500" },
  { min: 100, label: "101–250" },
  { min: 50, label: "51–100" },
  { min: 0, label: "1–50" },
] as const;

export const GAS_BAND_COUNT = GAS_CONSUMPTION_BANDS.length;

/** Index of the heaviest band the total falls into (0 = >1000 … 5 = 1–50). */
export function gasBandIndex(annualTotalKg: number): number {
  const band = GAS_CONSUMPTION_BANDS.findIndex((b) => annualTotalKg > b.min);
  return band === -1 ? GAS_BAND_COUNT - 1 : band;
}

/** Sequential blue scale (DESIGN.md navy family) — heaviest consumption darkest. */
export const GAS_BAND_COLORS = [
  "#0D2B52",
  "#004E77",
  "#0072A8",
  "#009EDB",
  "#5BB8E8",
  "#9AD6F2",
] as const;

export function gasBandColor(bandIndex: number): string {
  return GAS_BAND_COLORS[Math.min(Math.max(bandIndex, 0), GAS_BAND_COUNT - 1)];
}

/** Teardrop pin SVG scaled per band (1 = heaviest/largest … 0.7 = lightest). */
export function gasPinSvg(bandIndex: number): { svg: string; size: [number, number]; anchor: [number, number] } {
  const scale = 1 - Math.min(Math.max(bandIndex, 0), GAS_BAND_COUNT - 1) * 0.06;
  const width = Math.round(28 * scale);
  const height = Math.round(36 * scale);
  const color = gasBandColor(bandIndex);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 28 36" ` +
    `aria-hidden="true" focusable="false" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">` +
    `<path d="M14 1.5C7.1 1.5 1.5 7.1 1.5 14c0 9.6 12.5 20.2 12.5 20.2S26.5 23.6 26.5 14C26.5 7.1 20.9 1.5 14 1.5z" ` +
    `fill="${color}" stroke="#ffffff" stroke-width="1.5"/>` +
    `<circle cx="14" cy="13.5" r="4" fill="#ffffff"/></svg>`;
  return { svg, size: [width, height], anchor: [width / 2, height - 3] };
}

/** Localized display name of a consumption row (Arabic name when present). */
export function gasRowName(row: GasConsumptionRow, locale: "ar" | "en"): string {
  return locale === "ar" ? row.nameAr || row.nameEn : row.nameEn;
}

/** Formatted as-saved quantity (integer kg stay integral, up to 3 decimals). */
export function formatGasKg(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : String(Number(quantity.toFixed(3)));
}
