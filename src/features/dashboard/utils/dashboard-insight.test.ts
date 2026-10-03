import { describe, expect, it } from "vitest";
import type { TranslationKey } from "@/shared/i18n";
import { DEFAULT_FILTERS } from "./dashboard-filters";
import { buildDashboardInsight } from "./dashboard-insight";

const t = (key: TranslationKey, params?: Record<string, string | number>): string =>
  params ? `${key}(${JSON.stringify(params)})` : key;

describe("buildDashboardInsight", () => {
  it("returns empty text when nothing is filtered", () => {
    expect(buildDashboardInsight(DEFAULT_FILTERS, 12, t)).toBe("");
  });

  it("prefers the governorate context over district and status", () => {
    const text = buildDashboardInsight(
      { governorate: "Cairo", district: "Nasr", status: "Draft" },
      12,
      t
    );
    expect(text).toBe('dashboard.insightFilteredGov({"count":12,"name":"Cairo"})');
  });

  it("falls back to the district context", () => {
    const text = buildDashboardInsight(
      { governorate: "all", district: "Nasr", status: "Draft" },
      12,
      t
    );
    expect(text).toBe('dashboard.insightFilteredDistrict({"count":12,"district":"Nasr"})');
  });

  it("falls back to the status context with the translated status label", () => {
    const text = buildDashboardInsight(
      { governorate: "all", district: "all", status: "Scored" },
      12,
      t
    );
    expect(text).toBe(
      'dashboard.insightFilteredStatus({"count":12,"status":"status.Scored"})'
    );
  });
});
