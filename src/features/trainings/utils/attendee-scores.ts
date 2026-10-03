/**
 * Attendee score inputs are tri-state: blank means "no score recorded" (null),
 * an unparseable or fractional value is invalid (undefined). Accepted scores
 * are whole numbers spanning 0–100 inclusive, mirroring the backend attendee
 * rule (`AddAttendeeRequest`: `int?` + InclusiveBetween(0, 100)).
 */

export function parseAttendeeScore(raw: string): number | null | undefined {
  if (!raw.trim()) return null;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
}

export function isAttendeeScoreInRange(score: number | null): boolean {
  return score === null || (score >= 0 && score <= 100);
}

/**
 * Parses the add-attendee score pair in one shot: undefined when either input
 * is unparseable/fractional or out of range — the exact condition the dialog's
 * "invalid score" toast keys on.
 */
export function parseAttendeeScorePair(
  preRaw: string,
  postRaw: string
): { pre: number | null; post: number | null } | undefined {
  const pre = parseAttendeeScore(preRaw);
  const post = parseAttendeeScore(postRaw);
  const pairIsValid =
    pre !== undefined &&
    post !== undefined &&
    isAttendeeScoreInRange(pre) &&
    isAttendeeScoreInRange(post);
  return pairIsValid ? { pre, post } : undefined;
}
