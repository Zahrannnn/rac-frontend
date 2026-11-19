/**
 * Google Maps link → coordinates parser (customer 2026-11-02): field surveyors
 * paste a Maps link instead of typing latitude/longitude by hand. Pure string
 * work — no network, no dependencies. Consumed by the surveys closing step and
 * the workshops GPS capture fields; both then run their own save pipelines.
 *
 * Accepted shapes:
 *  1. `?q=lat,lng` — also URL-encoded ("lat%2Clng") and with a place name
 *     trailing the pair ("q=30.0444,31.2357+(Cairo+Tower)")
 *  2. `?ll=lat,lng`
 *  3. `@lat,lng` / `@lat,lng,zoom` — including /maps/place/…/@lat,lng paths
 *  4. a plain "lat,lng" paste (spaces around the comma tolerated)
 *
 * Numbers must be finite and inside the world range (lat [-90, 90],
 * lng [-180, 180] — the same bounds the save pipeline re-checks). Anything
 * else returns null.
 */

import {
  WORLD_LATITUDE_MAX,
  WORLD_LATITUDE_MIN,
  WORLD_LONGITUDE_MAX,
  WORLD_LONGITUDE_MIN,
} from "@/shared/validation/constants";

export type MapsCoordinates = { latitude: number; longitude: number };

const NUMBER = "[+-]?\\d+(?:\\.\\d+)?";
// A coordinate pair anchored at the string start ("30.0444, 31.2357 …").
const PAIR_AT_START = new RegExp(`^(${NUMBER})\\s*,\\s*(${NUMBER})`);
// The @lat,lng fragment Maps embeds in /maps/… paths; any trailing zoom chunk
// (",17z") is simply not consumed.
const AT_PAIR = new RegExp(`@(${NUMBER})\\s*,\\s*(${NUMBER})`);

function toCoordinates(rawLatitude: string, rawLongitude: string): MapsCoordinates | null {
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  if (
    latitude < WORLD_LATITUDE_MIN ||
    latitude > WORLD_LATITUDE_MAX ||
    longitude < WORLD_LONGITUDE_MIN ||
    longitude > WORLD_LONGITUDE_MAX
  ) {
    return null;
  }
  return { latitude, longitude };
}

/** decodeURIComponent that survives malformed escapes (%zz) in pasted text. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function pairFromQueryValue(value: string | null): MapsCoordinates | null {
  if (!value) {
    return null;
  }
  const match = PAIR_AT_START.exec(safeDecode(value).trim());
  return match ? toCoordinates(match[1], match[2]) : null;
}

export function parseMapsUrl(input: string): MapsCoordinates | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  // 4) plain "lat,lng" paste — checked before URL parsing (a bare pair is not
  // a URL, and this must not depend on URL quirks).
  const plain = PAIR_AT_START.exec(trimmed);
  if (plain) {
    return toCoordinates(plain[1], plain[2]);
  }

  // 1) + 2) ?q= / ?ll= query parameters (URLSearchParams handles single
  // percent-decoding; safeDecode adds a second pass for double-encoded pastes).
  let searchParams: URLSearchParams;
  try {
    searchParams = new URL(trimmed, "https://maps.google.com").searchParams;
  } catch {
    searchParams = new URLSearchParams();
  }
  const fromQuery = pairFromQueryValue(searchParams.get("q")) ?? pairFromQueryValue(searchParams.get("ll"));
  if (fromQuery) {
    return fromQuery;
  }

  // 3) @lat,lng(,zoom) anywhere in the string (Maps path fragments).
  const at = AT_PAIR.exec(trimmed);
  return at ? toCoordinates(at[1], at[2]) : null;
}
