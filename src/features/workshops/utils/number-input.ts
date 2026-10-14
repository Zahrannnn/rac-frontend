/** Numeric input bridge: an empty field means "no value", otherwise a number. */
export function parseOptionalNumber(raw: string): number | null {
  return raw === "" ? null : Number(raw);
}
