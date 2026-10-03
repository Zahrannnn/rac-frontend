/** Western digits everywhere (DESIGN.md) — locale-stable UTC formatting. */

/** YYYY/MM/DD from an ISO string; "—" for missing/invalid. */
export function formatDateUtc(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}`;
}

/** YYYY/MM/DD HH:mm from an ISO string (24h clock, UTC). */
export function formatDateTimeUtc(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${formatDateUtc(iso)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

/** ISO string → YYYY-MM-DDTHH:mm (UTC), used by DateTimePicker / visit forms. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())}`;
}

/** YYYY-MM-DDTHH:mm (UTC) → ISO instant, or null when blank/invalid. */
export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function pad(part: number): string {
  return String(part).padStart(2, "0");
}

/** UTC day-bounds for a date-range filter: `from` → start of day, `to` → end of day. */
export function utcDayBounds(
  from: string,
  to: string
): { dateFrom?: string; dateTo?: string } {
  return {
    dateFrom: from ? `${from}T00:00:00.000Z` : undefined,
    dateTo: to ? `${to}T23:59:59.000Z` : undefined,
  };
}
