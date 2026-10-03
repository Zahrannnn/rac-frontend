import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/features/workshops/types";
import type { ReportDefinition, ReportRun } from "../types";

const { useReportRunsMock } = vi.hoisted(() => ({ useReportRunsMock: vi.fn() }));

vi.mock("../hooks/use-reports", () => ({
  useReportRuns: useReportRunsMock,
}));

import { ReportRunsCard } from "./ReportRunsCard";

const catalog: ReportDefinition[] = [
  {
    id: "d1",
    key: "workshop_status_summary",
    name: "Workshop status summary",
    nameAr: "ملخص حالات الورش",
    description: "",
    defaultFrequency: "OnDemand",
  },
];

function run(overrides: Partial<ReportRun>): ReportRun {
  return {
    id: "r1",
    reportKey: "workshop_status_summary",
    format: "Xlsx",
    rowCount: 42,
    durationMs: 20,
    requestedBy: "admin",
    trigger: "manual",
    generatedAtUtc: "2026-09-01T10:00:00Z",
    ...overrides,
  };
}

const runsPage: PagedResult<ReportRun> = {
  items: [
    run({ id: "r1" }),
    run({ id: "r2", reportKey: "deleted_report", format: "Csv" }),
  ],
  page: 1,
  pageSize: 20,
  totalCount: 2,
};

function renderCard(onRegenerate: (definition: ReportDefinition) => void) {
  useReportRunsMock.mockReturnValue({
    data: runsPage,
    isPending: false,
    isPlaceholderData: false,
    isError: false,
    refetch: vi.fn(),
  });

  return render(
    <I18nProvider>
      <ReportRunsCard
        filters={{ page: 1 }}
        onFiltersChange={vi.fn()}
        catalog={catalog}
        onRegenerate={onRegenerate}
      />
    </I18nProvider>
  );
}

describe("ReportRunsCard", () => {
  it("renders the runs table with report titles and requested-by", () => {
    renderCard(vi.fn());

    expect(screen.getByText("ملخص حالات الورش")).toBeInTheDocument();
    expect(screen.getAllByText("admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("42").length).toBe(2);

    // Stored formats render as-is — legacy runs keep their original Json/Csv value.
    expect(screen.getAllByText("Xlsx").length).toBe(1);
    expect(screen.getAllByText("Csv").length).toBe(1);
  });

  it("regenerates through the catalog definition; unknown keys stay disabled", () => {
    const onRegenerate = vi.fn();
    renderCard(onRegenerate);

    const buttons = screen.getAllByRole("button", { name: "إعادة التوليد" });
    expect(buttons).toHaveLength(2);

    // Known key → enabled and hands the catalog definition to the generate flow.
    expect(buttons[0]).toBeEnabled();
    if (buttons[0]) {
      fireEvent.click(buttons[0]);
    }
    expect(onRegenerate).toHaveBeenCalledWith(catalog[0]);

    // Unknown key (report no longer in the catalog) → disabled.
    expect(buttons[1]).toBeDisabled();
  });
});
