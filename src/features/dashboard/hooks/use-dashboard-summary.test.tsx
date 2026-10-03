import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { FullDashboardSummary } from "../types";

const { fetchDashboardSummaryMock } = vi.hoisted(() => ({
  fetchDashboardSummaryMock: vi.fn(),
}));

vi.mock("../api/dashboard-adapter", () => ({
  fetchDashboardSummary: fetchDashboardSummaryMock,
}));

import { useDashboardSummary } from "./use-dashboard-summary";

const summary: FullDashboardSummary = {
  totalWorkshops: 1,
  totalTechnicians: 0,
  workshopsLast30Days: 0,
  byStatus: [],
  byGovernorate: [],
  surveys: [],
  pulse: { scoredCount: 0, recommendedTarget: 0 },
  attention: {
    incompleteFailing: 0,
    stuckDrafts: 0,
    unscoredComplete: 0,
  },
};

describe("useDashboardSummary", () => {
  it("includes district in the query key and the fetch params", async () => {
    fetchDashboardSummaryMock.mockResolvedValue(summary);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    renderHook(
      () => useDashboardSummary({ governorate: "Cairo", district: "Nasr", status: "all" }),
      { wrapper }
    );

    await waitFor(() => expect(fetchDashboardSummaryMock).toHaveBeenCalled());

    expect(fetchDashboardSummaryMock).toHaveBeenCalledWith({
      governorate: "Cairo",
      district: "Nasr",
      status: "all",
    });
    expect(client.getQueryCache().getAll()[0]?.queryKey).toEqual([
      "dashboard",
      "summary",
      "Cairo",
      "Nasr",
      "all",
    ]);
  });
});
