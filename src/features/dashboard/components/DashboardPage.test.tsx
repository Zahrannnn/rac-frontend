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
    { workshopId: "w1", workshopCode: "MAC-CAR-000001", status: "Complete", failingRules: 0 },
    { workshopId: "w2", workshopCode: "MAC-CAR-000002", status: "Incomplete", failingRules: 2 },
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

const trainerSummary: DashboardSummary = {
  totalSessions: 9,
  completedSessions: 6,
  upcomingSessions: 3,
  governoratesCovered: 4,
  attendeesTrained: 120,
  avgPreScore: 62.5,
  avgPostScore: 75,
  avgGain: 12.5,
  nextSession: {
    id: "s-1",
    title: "دورة صيانة وسط التبريد",
    governorate: "Cairo",
    venue: "مركز تدريب القاهرة",
    startAtUtc: "2026-10-20T09:00:00Z",
    status: "Upcoming",
  },
  recentSessions: [
    {
      id: "s-2",
      title: "دورة التبريد الأساسية",
      governorate: "Giza",
      venue: "قاعة الجيزة",
      startAtUtc: "2026-10-01T09:00:00Z",
      status: "Completed",
      attendeeCount: 15,
    },
  ],
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
    expect(screen.queryByText("MAC-CAR-000002")).not.toBeInTheDocument();
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

  it("trainer shape: trainer view renders with its KPI labels, not the executive view", () => {
    summaryState.data = trainerSummary;
    renderDashboard();

    expect(screen.getByText("إجمالي الدورات")).toBeInTheDocument();
    expect(screen.getByText("دورات منتهية")).toBeInTheDocument();
    expect(screen.getByText("دورات قادمة")).toBeInTheDocument();
    expect(screen.getByText("إجمالي المتدربين")).toBeInTheDocument();
    // Trainer ignores national filters — no pipeline or workshop geography view.
    expect(screen.queryByText("من التسجيل إلى الاختيار")).not.toBeInTheDocument();
    expect(screen.queryByText("إجمالي الورش")).not.toBeInTheDocument();
    // Stat chips: coverage + score averages with the highlighted gain.
    expect(screen.getByText("محافظات مغطاة")).toBeInTheDocument();
    expect(screen.getByText("متوسط التحسن")).toBeInTheDocument();
    expect(screen.getByText("+12.5")).toBeInTheDocument();
    // Recent sessions table carries the completed status label (never color alone).
    expect(screen.getByText("منتهية")).toBeInTheDocument();
    expect(screen.getByText("دورة التبريد الأساسية")).toBeInTheDocument();
  });

  it("trainer shape: null nextSession shows the friendly empty state", () => {
    summaryState.data = { ...trainerSummary, nextSession: null };
    renderDashboard();

    expect(screen.getByText("الجلسة القادمة")).toBeInTheDocument();
    expect(screen.getByText("لا توجد جلسات قادمة")).toBeInTheDocument();
    expect(screen.queryByText("دورة صيانة وسط التبريد")).not.toBeInTheDocument();
  });

  it("trainer shape: next session card names the session, date, and venue", () => {
    summaryState.data = trainerSummary;
    renderDashboard();

    expect(screen.getByText("دورة صيانة وسط التبريد")).toBeInTheDocument();
    expect(screen.getByText("القاهرة · مركز تدريب القاهرة")).toBeInTheDocument();
  });
});
