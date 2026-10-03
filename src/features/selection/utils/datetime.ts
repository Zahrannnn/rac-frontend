/**
 * Locale-aware UTC formatting for selection-run timestamps (ar-EG digits/month names,
 * en-GB otherwise) — intentionally NOT the shared western-digit helpers in
 * `@/shared/utils/datetime`, which render `YYYY/MM/DD` regardless of locale.
 */

/** Medium date + short time in UTC; falls back to the raw ISO string when unformattable. */
export function formatUtc(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
