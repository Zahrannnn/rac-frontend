import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ExecutiveDashboardSummary } from "@/features/dashboard";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/features/workshops/types";
import type { ReportDefinition, ReportRun } from "../types";

const {
  fetchDashboardSummaryMock,
  useAuthMock,
  useReportCatalogMock,
  useReportRunsMock,
  generateMutateMock,
} = vi.hoisted(() => ({
  fetchDashboardSummaryMock: vi.fn(),
  useAuthMock: vi.fn(),
  useReportCatalogMock: vi.fn(),
  useReportRunsMock: vi.fn(),
  generateMutateMock: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: useAuthMock,
  can: (permissions: string[], permission: string) =>
    permissions.includes("*") || permissions.includes(permission),
}));

vi.mock("@/features/dashboard/api/dashboard-adapter", () => ({
  fetchDashboardSummary: fetchDashboardSummaryMock,
}));

vi.mock("../hooks/use-reports", () => ({
  useReportCatalog: useReportCatalogMock,
  useReportRuns: useReportRunsMock,
  useGenerateReport: () => ({ mutate: generateMutateMock, isPending: false }),
}));

import { ReportsPage } from "./ReportsPage";

const definition: ReportDefinition = {
  id: "d1",
  key: "workshop_status_summary",
  name: "Workshop status summary",
  nameAr: "ملخص حالات الورش",
  description: "All workshops by status",
  defaultFrequency: "OnDemand",
};

const emptyRuns: PagedResult<ReportRun> = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
};

const executiveSummary: ExecutiveDashboardSummary = {
  totalWorkshops: 21,
  byStatus: [{ status: "Scored", count: 6 }],
  byGovernorate: [],
  pulse: { scoredCount: 6, recommendedTarget: 150 },
};

function renderPage(runs: PagedResult<ReportRun> = emptyRuns) {
  fetchDashboardSummaryMock.mockResolvedValue(executiveSummary);
  generateMutateMock.mockClear();
  useAuthMock.mockReturnValue({ user: { permissions: ["reports:generate", "reports:manage"] } });
  useReportCatalogMock.mockReturnValue({
    data: [definition],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  useReportRunsMock.mockReturnValue({
    data: runs,
    isPending: false,
    isPlaceholderData: false,
    isError: false,
    refetch: vi.fn(),
  });

  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  );
  return render(<ReportsPage />, { wrapper });
}

describe("ReportsPage", () => {
  it("header generate action opens the picker, then the single-action generate dialog", async () => {
    renderPage();

    // Catalog + overview render (the runs history table is currently disabled).
    expect(await screen.findByText("كتالوج التقارير")).toBeInTheDocument();

    // The page header hosts the single primary generate action.
    const header = within(screen.getByRole("banner"));
    fireEvent.click(header.getByRole("button", { name: "توليد" }));

    // Picker lists the catalog; picking a report opens the generate dialog.
    expect(await screen.findByText("اختر تقريرًا من الكتالوج لتوليده")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ملخص حالات الورش/ }));

    // XLSX-only: the dialog has one download action — no format selector.
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ملخص حالات الورش")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "تنزيل" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(within(dialog).queryByText("صيغة الملف")).not.toBeInTheDocument();

    // The generation request carries the key + filters only — no format.
    fireEvent.click(within(dialog).getByRole("button", { name: "تنزيل" }));
    expect(generateMutateMock).toHaveBeenCalledTimes(1);
    expect(generateMutateMock.mock.calls[0][0]).toEqual({
      key: "workshop_status_summary",
      filters: {},
    });
  });
});
