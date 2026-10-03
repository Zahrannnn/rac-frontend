import type { useT } from "@/shared/i18n";
import type { DashboardFilterState } from "./dashboard-filters";

type Translate = ReturnType<typeof useT>;

/**
 * Insight text carries filter context only — unfiltered, the pulse band's
 * progress rail already tells the complete-or-scored story. Governorate wins
 * over district over status, mirroring the filter cascade.
 */
export function buildDashboardInsight(
  filters: DashboardFilterState,
  totalWorkshops: number,
  t: Translate
): string {
  if (filters.governorate !== "all") {
    return t("dashboard.insightFilteredGov", {
      count: totalWorkshops,
      name: filters.governorate,
    });
  }
  if (filters.district !== "all") {
    return t("dashboard.insightFilteredDistrict", {
      count: totalWorkshops,
      district: filters.district,
    });
  }
  if (filters.status !== "all") {
    return t("dashboard.insightFilteredStatus", {
      count: totalWorkshops,
      status: t(`status.${filters.status}`),
    });
  }
  return "";
}
