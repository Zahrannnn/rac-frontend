import { ar, type TranslationKey } from "@/shared/i18n";
import type { RubricKind } from "../types";

/**
 * Backend rubric label keys arrive as plain strings ("rubric.participation.legal_status",
 * "rubric.band.legal_full" — the convention pinned in RubricDefinitions.cs). The dictionary
 * owns the ar/en translations; this guard keeps an unknown backend key from rendering
 * "undefined" by falling back to a real dictionary key.
 */
export function toTranslationKey(key: string, fallback: TranslationKey): TranslationKey {
  return key in ar ? (key as TranslationKey) : fallback;
}

export function criterionLabel(labelKey: string): TranslationKey {
  return toTranslationKey(labelKey, "selection.criterion.unknown");
}

export function bandLabel(bandLabelKey: string): TranslationKey {
  return toTranslationKey(bandLabelKey, "rubric.band.none");
}

/** Signed cut targets per run kind (SelectionCuts.cs) — used for the confirm copy. */
export const RUN_TARGETS: Record<RubricKind, { recommended: number; reserve: number }> = {
  participation: { recommended: 150, reserve: 50 },
  equipment: { recommended: 50, reserve: 10 },
};

/** Tier badge text labels — status is never color alone (DESIGN.md). */
export function tierLabelKey(tier: string): TranslationKey | null {
  if (tier === "recommended") return "selection.tier.recommended";
  if (tier === "reserve") return "selection.tier.reserve";
  return null;
}
