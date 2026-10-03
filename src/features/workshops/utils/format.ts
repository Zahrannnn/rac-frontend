import type { Workshop } from "../types";

export { formatDateUtc } from "@/shared/utils/datetime";
export { governorateLabel } from "@/shared/constants/egypt";

/** Bilingual display rule: the Arabic name leads, the English name is the fallback. */
export function workshopDisplayName(workshop: Pick<Workshop, "nameAr" | "nameEn">): string {
  return workshop.nameAr || workshop.nameEn;
}
