/**
 * Trainer-dashboard score formatting — Western digits, one decimal, "—" for
 * unrecorded averages (null means the session has no scored attendees yet).
 */

export function formatTrainerScore(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

/** Signed gain: "+12.5" / "-3.0" / "0.0"; "—" when unknown. */
export function formatTrainerGain(gain: number | null): string {
  if (gain === null) {
    return "—";
  }
  return `${gain > 0 ? "+" : ""}${gain.toFixed(1)}`;
}
