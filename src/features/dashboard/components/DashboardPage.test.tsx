import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DashboardSummary } from "../types";

const summaryState: { data: DashboardSummary | undefined } = { data: undefined };
const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("../hooks/use-dashboard-summary", () => ({
  useDashboardSummary: () => ({
    data: summaryState.data,
    isPending: !summaryState.data,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

vi.mock("../hooks/use-dashboard-map", () => ({
  useDashboardMap: () => ({
    data: { points: [] },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    isFetching: false,
  }),
}));

import { DashboardPage } from "./DashboardPage";

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <DashboardPage />
      </I18nProvider>
    </QueryClientProvider>
  );
}

const fullSummary: DashboardSummary = {
  totalWorkshops: 12,
  totalTechnicians: 30,
  workshopsLast30Days: 4,
  byStatus: [
    { status: "Draft", count: 4 },
    { status: "Complete", count: 5 },
    { status: "Submitted", count: 3 },
  ],
  byGovernorate: [
    { governorate: "Cairo", count: 7 },
    { governorate: "Giza", count: 5 },
  ],
  surveys: [
    { workshopId: "w1", workshopCode: "RAC-CAR-000001", status: "Complete", failingRules: 0 },
    { workshopId: "w2", workshopCode: "RAC-CAR-000002", status: "Incomplete", failingRules: 2 },
  ],
  pulse: { rankedCount: 3, recommendedTarget: 150 },
  attention: {
    incompleteFailing: 2,
    stuckDrafts: 0,
    awaitingSelectionCount: 5,
  },
};

const assignedSummary: DashboardSummary = {
  myWorkshops: 3,
  mySurveysDraft: 1,
  mySurveysSubmitted: 0,
  mySurveysComplete: 1,
  mySurveysIncomplete: 2,
  attention: {
    incompleteFailing: 1,
  },
};

const executiveSummary: DashboardSummary = {
  totalWorkshops: 40,
  byStatus: [{ status: "Complete", count: 40 }],
  byGovernorate: [
    { governorate: "Cairo", count: 7 },
    { governorate: "Giza", count: 5 },
  ],
  pulse: { rankedCount: 40, recommendedTarget: 150 },
};

describe("DashboardPage hybrid pulse + attention", () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });
  it("full shape: shows dual pulse and attention chips (no failing-surveys list)", () => {
    summaryState.data = fullSummary;
    renderDashboard();

    expect(screen.getByText("إجمالي الورش")).toBeInTheDocument();
    expect(screen.getByText("من التسجيل إلى الاختيار")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /مسودة/ })).toBeInTheDocument();
    expect(screen.getByText("يحتاج متابعة")).toBeInTheDocument();
    expect(screen.getByText("استبيانات غير مكتملة (قواعد راسبة)")).toBeInTheDocument();
    expect(screen.getByText("استبيانات مكتملة بانتظار الترتيب")).toBeInTheDocument();
    expect(screen.queryByText("استبيانات بها بنود ناقصة")).not.toBeInTheDocument();
    expect(screen.queryByText("RAC-CAR-000002")).not.toBeInTheDocument();
  });

  it("full shape: shows all-clear when attention counts are zero", () => {
    summaryState.data = {
      ...fullSummary,
      attention: {
        incompleteFailing: 0,
        stuckDrafts: 0,
        awaitingSelectionCount: 0,
      },
    };
    renderDashboard();

    expect(screen.getByText(/لا توجد عناصر متابعة مفتوحة/)).toBeInTheDocument();
  });

  it("assigned shape: slim attention without office chips", () => {
    summaryState.data = assignedSummary;
    renderDashboard();

    expect(screen.getByText("ورشي المسندة")).toBeInTheDocument();
    expect(screen.getByText("استبيانات غير مكتملة (قواعد راسبة)")).toBeInTheDocument();
    expect(screen.queryByText("مسودات عالقة (>٧ أيام)")).not.toBeInTheDocument();
    expect(screen.queryByText(/لديك 2 استبيان غير مكتمل/)).not.toBeInTheDocument();
  });

  it("executive shape: pulse without attention or survey queues", () => {
    summaryState.data = executiveSummary;
    renderDashboard();

    expect(screen.getByText("من التسجيل إلى الاختيار")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /مسودة/ })).toBeInTheDocument();
    expect(screen.queryByText("يحتاج متابعة")).not.toBeInTheDocument();
    // The completed-surveys stat rides the pipeline hero (dashboard.surveysComplete).
    expect(screen.getByText("استبيانات مكتملة")).toBeInTheDocument();
    expect(screen.queryByText("استبياناتي المكتملة")).not.toBeInTheDocument();
  });
});
