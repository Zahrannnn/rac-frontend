import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { TrainerDashboardSummary } from "../types";
import { TrainerDashboard } from "./TrainerDashboard";

const summary: TrainerDashboardSummary = {
  totalSessions: 9,
  completedSessions: 6,
  upcomingSessions: 3,
  governoratesCovered: 4,
  attendeesTrained: 120,
  avgPreScore: 62.5,
  avgPostScore: 75,
  avgGain: 12.5,
  nextSession: null,
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
    {
      id: "s-3",
      title: "دورة الصيانة المتقدمة",
      governorate: "Cairo",
      venue: "قاعة القاهرة",
      startAtUtc: "2026-10-05T09:00:00Z",
      status: "Upcoming",
      attendeeCount: 8,
    },
  ],
};

function renderTrainerDashboard() {
  return render(
    <I18nProvider>
      <TrainerDashboard summary={summary} />
    </I18nProvider>
  );
}

describe("TrainerDashboard recent sessions", () => {
  it("renders the recent sessions in the shared DataTable", () => {
    renderTrainerDashboard();

    const table = screen.getByRole("table", { name: "الدورات التدريبية الأخيرة" });
    expect(table).toBeInTheDocument();
    // Header + the two most recent sessions.
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    // Status stays a text-labeled badge (never color alone).
    expect(within(table).getByText("منتهية")).toBeInTheDocument();
  });
});
