/** Pure coordinate helpers for the map card and wizard (server re-validates bounds). */

export function hasCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined
): boolean {
  return latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;
}

/** Western digits, 6 dp max, tabular-friendly: "30.0444, 31.2357". */
export function formatCoords(latitude: number, longitude: number): string {
  const trim = (value: number) => String(Number(value.toFixed(6)));
  return `${trim(latitude)}, ${trim(longitude)}`;
}

/** External deep-link only — the app itself never uses Google APIs (CONTEXT.md 10b). */
export function googleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

function inEgyptBounds(lat: number, lon: number): boolean {
  return lat >= 21 && lat <= 32 && lon >= 24 && lon <= 37;
}

/**
 * The location card's save rule: a full pair is required, and it must land
 * inside Egypt (same bounds as the zod schema — the server re-validates).
 * Returns the dictionary key to show, or null when the pair is savable.
 */
export function coordinatePairError(
  latitude: number | null,
  longitude: number | null
): "wizard.gpsPairInvalid" | "map.coordsOutOfBounds" | null {
  if (latitude === null || longitude === null) {
    return "wizard.gpsPairInvalid";
  }
  return inEgyptBounds(latitude, longitude) ? null : "map.coordsOutOfBounds";
}
