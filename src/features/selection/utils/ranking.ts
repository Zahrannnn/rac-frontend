import type { RankedWorkshop } from "../types";

/** Signed program targets: 150 delivery candidates + the next 50 as reserve. */
export const RECOMMENDED_TARGET = 150;
export const RESERVE_TARGET = 50;

export type Tier = "recommended" | "reserve" | "none";

export type RankingSortKey = "rank" | "workshopName" | "governorate" | "totalWeighted";
export type SortDirection = "asc" | "desc";

export const DEFAULT_SORT: { key: RankingSortKey; direction: SortDirection } = {
  key: "rank",
  direction: "asc",
};

/** Delivery tier for a ranking position — derived client-side from rank order. */
export function tierForRank(rank: number): Tier {
  if (rank <= RECOMMENDED_TARGET) {
    return "recommended";
  }
  if (rank <= RECOMMENDED_TARGET + RESERVE_TARGET) {
    return "reserve";
  }
  return "none";
}

export function filterByGovernorate(
  rows: RankedWorkshop[],
  governorate: string | undefined
): RankedWorkshop[] {
  if (!governorate) {
    return rows;
  }
  return rows.filter((row) => row.governorate === governorate);
}

export function sortRanking(
  rows: RankedWorkshop[],
  sort: { key: RankingSortKey; direction: SortDirection }
): RankedWorkshop[] {
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === "totalWeighted") {
      return (a.totalWeighted - b.totalWeighted) * factor;
    }
    if (sort.key === "rank") {
      return (a.rank - b.rank) * factor;
    }
    return a[sort.key].localeCompare(b[sort.key], "ar") * factor;
  });
}

/** Next sort state for a header click — same key flips, new key takes its natural order. */
export function nextSort(
  current: { key: RankingSortKey; direction: SortDirection },
  key: RankingSortKey
): { key: RankingSortKey; direction: SortDirection } {
  if (current.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return {
    key,
    direction: key === "totalWeighted" ? "desc" : "asc",
  };
}
