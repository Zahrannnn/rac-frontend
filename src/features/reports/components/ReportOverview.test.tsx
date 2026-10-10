import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  type AssignedDashboardSummary,
  type DashboardSummary,
  type ExecutiveDashboardSummary,
  type FullDashboardSummary,
} from "@/features/dashboard";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { ReportRun } from "../types";

const { fetchDashboardSummaryMock, fetchRunsMock } = vi.hoisted(() => ({
  fetchDashboardSummaryMock: vi.fn(),
  fetchRunsMock: vi.fn(),
}));

vi.mock("@/features/dashboard/api/dashboard-adapter", () => ({
  fetchDashboardSummary: fetchDashboardSummaryMock,
}));

vi.mock("../api/reports-adapter", () => ({
  fetchCatalog: vi.fn(),
  fetchRuns: fetchRunsMock,
  generateReport: vi.fn(),
}));

import { ReportOverview } from "./ReportOverview";

const fullSummary: FullDashboardSummary = {
  totalWorkshops: 21,
  totalTechnicians: 30,
  workshopsLast30Days: 2,
  byStatus: [
    { status: "Complete", count: 8 },
    { status: "Submitted", count: 6 },
  ],
  byGovernorate: [
    { governorate: "Cairo", count: 12 },
    { governorate: "Giza", count: 9 },
  ],
  surveys: [],
  pulse: { rankedCount: 6, recommendedTarget: 150 },
  attention: {
    incompleteFailing: 0,
    stuckDrafts: 0,
    awaitingSelectionCount: 0,
  },
};

const executiveSummary: ExecutiveDashboardSummary = {
  totalWorkshops: 21,
  byStatus: [
    { status: "Complete", count: 8 },
    { status: "Submitted", count: 6 },
    { status: "Draft", count: 4 },
  ],
  byGovernorate: [],
  pulse: { rankedCount: 6, recommendedTarget: 150 },
};

const assignedSummary: AssignedDashboardSummary = {
  myWorkshops: 3,
  mySurveysDraft: 1,
  mySurveysSubmitted: 0,
  mySurveysComplete: 1,
  mySurveysIncomplete: 2,
  attention: { incompleteFailing: 1 },
};

function run(overrides: Partial<ReportRun>): ReportRun {
  return {
    id: "r1",
    reportKey: "workshop_status_summary",
    format: "Xlsx",
    rowCount: 10,
    durationMs: 12,
    requestedBy: "admin",
    trigger: "manual",
    generatedAtUtc: "2026-09-01T10:00:00Z",
    ...overrides,
  };
}

const runsPage: PagedResult<ReportRun> = {
  items: [
    run({ id: "r1", format: "Xlsx" }),
    run({ id: "r2", format: "Xlsx" }),
    run({ id: "r3", format: "Csv" }),
  ],
  page: 1,
  pageSize: 100,
  totalCount: 3,
};

function renderOverview(canManage = true, summary: DashboardSummary = fullSummary) {
  fetchDashboardSummaryMock.mockResolvedValue(summary);
  fetchRunsMock.mockResolvedValue(runsPage);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  );
  return render(<ReportOverview canManage={canManage} />, { wrapper });
}

describe("ReportOverview", () => {
  it("renders KPI values from the dashboard summary (full shape)", async () => {
    renderOverview();

    expect(await screen.findByText("إجمالي الورش")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("إجمالي الفنيين النشطين")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();

    // Workshops-by-governorate bars come from ByGovernorate.
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();

    // Runs-by-format counts come from the runs list.
    expect(screen.getByText("عمليات التشغيل حسب الصيغة")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("falls back to status counts for the executive shape (no technicians field)", async () => {
    renderOverview(true, executiveSummary);

    expect(await screen.findByText("مسودة")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.queryByText("إجمالي الفنيين النشطين")).not.toBeInTheDocument();
  });

  it("hides the runs-by-format chart without reports:manage", async () => {
    renderOverview(false);

    await screen.findByText("إجمالي الورش");

    expect(screen.queryByText("عمليات التشغيل حسب الصيغة")).not.toBeInTheDocument();
  });

  it("renders nothing for the assigned summary shape (no invented KPIs)", async () => {
    const { container } = renderOverview(true, assignedSummary);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
