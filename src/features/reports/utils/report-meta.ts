import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Factory,
  HardHat,
  MapPinned,
  Package,
  Shield,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import type { ReportDefinition } from "../types";

export type ReportCategory = "workshops" | "people" | "monitoring" | "compliance";

type ReportMeta = {
  icon: LucideIcon;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  category: ReportCategory;
};

/** Dictionary-backed metadata for the seeded catalog (10 definitions). */
const KNOWN_REPORTS: Record<string, ReportMeta> = {
  workshop_status_summary: {
    icon: Factory,
    titleKey: "report.workshop_status_summary.title",
    descriptionKey: "report.workshop_status_summary.description",
    category: "workshops",
  },
  governorate_coverage: {
    icon: MapPinned,
    titleKey: "report.governorate_coverage.title",
    descriptionKey: "report.governorate_coverage.description",
    category: "workshops",
  },
  workshop_registry: {
    icon: ClipboardCheck,
    titleKey: "report.workshop_registry.title",
    descriptionKey: "report.workshop_registry.description",
    category: "workshops",
  },
  survey_validation: {
    icon: Shield,
    titleKey: "report.survey_validation.title",
    descriptionKey: "report.survey_validation.description",
    category: "compliance",
  },
  selection_recommended: {
    icon: Trophy,
    titleKey: "report.selection_recommended.title",
    descriptionKey: "report.selection_recommended.description",
    category: "monitoring",
  },
  technician_registry: {
    icon: HardHat,
    titleKey: "report.technician_registry.title",
    descriptionKey: "report.technician_registry.description",
    category: "people",
  },
  training_records: {
    icon: Users,
    titleKey: "report.training_records.title",
    descriptionKey: "report.training_records.description",
    category: "people",
  },
  equipment_deliveries: {
    icon: Package,
    titleKey: "report.equipment_deliveries.title",
    descriptionKey: "report.equipment_deliveries.description",
    category: "monitoring",
  },
  audit_user_activity: {
    icon: Wrench,
    titleKey: "report.audit_user_activity.title",
    descriptionKey: "report.audit_user_activity.description",
    category: "compliance",
  },
};

export const REPORT_CATEGORIES: readonly ReportCategory[] = [
  "workshops",
  "people",
  "monitoring",
  "compliance",
];

export function reportCategory(key: string): ReportCategory | null {
  return KNOWN_REPORTS[key]?.category ?? null;
}

/**
 * Resolved display metadata — known keys use the dictionary (Arabic-first);
 * anything new from the backend falls back to nameAr/name by locale.
 */
export function useReportMeta(
  definition: ReportDefinition
): { icon: LucideIcon; title: string; description: string; category: ReportCategory | null } {
  const t = useT();
  const { locale } = useI18n();
  const known = KNOWN_REPORTS[definition.key];

  if (!known) {
    const title =
      locale === "ar" && definition.nameAr ? definition.nameAr : definition.name;
    return { icon: Factory, title, description: definition.description, category: null };
  }
  return {
    icon: known.icon,
    title: t(known.titleKey),
    description: t(known.descriptionKey),
    category: known.category,
  };
}

type Translate = (key: TranslationKey) => string;

/** Pure title resolver — safe outside React and inside SelectItem labels. */
export function resolveReportTitle(
  key: string,
  t: Translate,
  locale: string,
  catalog: ReportDefinition[] = []
): string {
  const known = KNOWN_REPORTS[key];
  if (known) return t(known.titleKey);

  const fromCatalog = catalog.find((item) => item.key === key);
  if (fromCatalog) {
    if (locale === "ar" && fromCatalog.nameAr) return fromCatalog.nameAr;
    return fromCatalog.name || key;
  }
  return key;
}

/** Searchable blob for catalog filtering (API fields + localized title/description). */
export function reportSearchBlob(definition: ReportDefinition, t: Translate): string {
  const known = KNOWN_REPORTS[definition.key];
  const localized = known
    ? `${t(known.titleKey)} ${t(known.descriptionKey)}`
    : "";
  return [
    definition.name,
    definition.nameAr ?? "",
    definition.key,
    definition.description,
    localized,
  ]
    .join(" ")
    .toLowerCase();
}

/** Human title for a report key — used by run history when only the key is available. */
export function useReportTitle(
  key: string,
  catalog: ReportDefinition[] = []
): string {
  const t = useT();
  const { locale } = useI18n();
  return resolveReportTitle(key, t, locale, catalog);
}
