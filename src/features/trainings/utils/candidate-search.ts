import type { Locale } from "@/shared/i18n";
import type { TechnicianCandidate } from "../types";

/** The technician-candidates endpoint never returns more than this many rows. */
export const CANDIDATE_RESULT_CAP = 20;

/** The technician-candidates endpoint only answers searches of two or more
 * characters (trimmed) — shorter input keeps the query disabled. */
export function isCandidateSearchReady(search: string): boolean {
  return search.trim().length >= 2;
}

const ARABIC_INDIC_ZERO = 0x0660;
const EXTENDED_ARABIC_INDIC_ZERO = 0x06f0;

/** Maps Arabic-Indic and Persian digits to Western digits (stored data uses Western). */
export function toWesternDigits(raw: string): string {
  return raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - ARABIC_INDIC_ZERO))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - EXTENDED_ARABIC_INDIC_ZERO));
}

/**
 * Canonical form of a picker query: trimmed, inner whitespace collapsed, and
 * Western digits, so mobile numbers and workshop codes typed on an Arabic
 * keyboard still match.
 */
export function normalizeCandidateSearch(raw: string): string {
  return toWesternDigits(raw).replace(/\s+/g, " ").trim();
}

/** Primary name in the UI language, plus the other script when it differs. */
export function candidateNames(
  candidate: TechnicianCandidate,
  locale: Locale
): { primary: string; secondary: string | null } {
  const ar = candidate.fullNameAr?.trim() || null;
  const en = candidate.fullName;
  const primary = locale === "ar" ? (ar ?? en) : en || (ar ?? "");
  const other = locale === "ar" ? en : ar;
  return { primary, secondary: other && other !== primary ? other : null };
}

/** DOM id of a candidate's listbox option (target of aria-activedescendant). */
export function candidateOptionId(baseId: string, technicianId: string): string {
  return `${baseId}-option-${technicianId}`;
}

/**
 * The next candidate that can still be added, searching forward from
 * `technicianId` and wrapping around, so batch adds move the highlight on.
 */
export function nextAddableCandidate(
  candidates: readonly TechnicianCandidate[],
  technicianId: string,
  enrolledTechnicianIds: ReadonlySet<string>
): TechnicianCandidate | undefined {
  const at = candidates.findIndex((candidate) => candidate.id === technicianId);
  return [...candidates.slice(at + 1), ...candidates.slice(0, at)].find(
    (candidate) => !enrolledTechnicianIds.has(candidate.id)
  );
}
