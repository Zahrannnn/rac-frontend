import { GOVERNORATE_AR } from "@/shared/constants/egypt";
import { useT } from "@/shared/i18n";
import type { GovernorateCount } from "../types";

const TOP_N = 6;

export const OTHERS_KEY = "__others__";

export type SliceRow = {
  key: string;
  label: string;
  count: number;
  /** Real governorate id, or null for the rolled-up “Others” slice. */
  governorate: string | null;
};

function labelGovernorate(name: string, locale: string): string {
  if (locale !== "ar") {
    return name;
  }
  return GOVERNORATE_AR[name as keyof typeof GOVERNORATE_AR] ?? name;
}

/**
 * Pie-slice derivation for the governorate ranking: sorts the counts
 * best-first, localizes the labels and rolls everything past the top N into
 * a single “Others” slice.
 */
export function buildRankingSlices(
  byGovernorate: GovernorateCount[],
  locale: string,
  t: ReturnType<typeof useT>
): SliceRow[] {
  const ranked = [...byGovernorate].sort(
    (a, b) => b.count - a.count || a.governorate.localeCompare(b.governorate)
  );

  if (ranked.length === 0) {
    return [];
  }

  const head = ranked.slice(0, TOP_N);
  const tail = ranked.slice(TOP_N);
  const rows: SliceRow[] = head.map((entry) => ({
    key: entry.governorate,
    label: labelGovernorate(entry.governorate, locale),
    count: entry.count,
    governorate: entry.governorate,
  }));

  if (tail.length > 0) {
    rows.push({
      key: OTHERS_KEY,
      label: t("dashboard.rankingOthers"),
      count: tail.reduce((sum, entry) => sum + entry.count, 0),
      governorate: null,
    });
  }

  return rows;
}
