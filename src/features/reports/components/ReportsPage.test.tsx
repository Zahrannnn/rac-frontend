import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ExecutiveDashboardSummary } from "@/features/dashboard";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { ReportDefinition, ReportRun } from "../types";

// Radix Select relies on pointer-capture APIs jsdom does not implement.
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.scrollIntoView = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

const {
  fetchDashboardSummaryMock,
  useAuthMock,
  useReportCatalogMock,
  useReportRunsMock,
  useTrainersMock,
  generateMutateMock,
} = vi.hoisted(() => ({
  fetchDashboardSummaryMock: vi.fn(),
  useAuthMock: vi.fn(),
  useReportCatalogMock: vi.fn(),
  useReportRunsMock: vi.fn(),
  useTrainersMock: vi.fn(),
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
  useTrainers: useTrainersMock,
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

const trainingDefinition: ReportDefinition = {
  id: "d2",
  key: "training_records",
  name: "Training records",
  nameAr: "سجلات التدريب",
  description: "Training sessions with attendees and pre/post scores",
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
  byStatus: [{ status: "Submitted", count: 6 }],
  byGovernorate: [],
  pulse: { rankedCount: 6, recommendedTarget: 150 },
};

function renderPage(runs: PagedResult<ReportRun> = emptyRuns, catalog = definition) {
  fetchDashboardSummaryMock.mockResolvedValue(executiveSummary);
  generateMutateMock.mockClear();
  useAuthMock.mockReturnValue({ user: { permissions: ["reports:generate", "reports:manage"] } });
  useReportCatalogMock.mockReturnValue({
    data: [catalog],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  useTrainersMock.mockReturnValue({
    data: [
      { name: "أ. محمد عبد الله", key: "TRN-1" },
      { name: "Eng. Samir Hassan", key: null },
    ],
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

  it("training records dialog selects the trainer from existing trainers", async () => {
    renderPage(emptyRuns, trainingDefinition);

    expect(await screen.findByText("كتالوج التقارير")).toBeInTheDocument();
    const card = screen.getByText("سجلات التدريب").closest("article");
    if (!card) throw new Error("training records card not found");
    fireEvent.click(within(card as HTMLElement).getByRole("button", { name: "توليد" }));

    const dialog = await screen.findByRole("dialog");
    // The trainer filter is a select over existing trainers — the old free-text
    // input is gone.
    expect(within(dialog).queryByRole("textbox", { name: "المدرب" })).not.toBeInTheDocument();
    const trainerCombo = within(dialog).getByRole("combobox", { name: "المدرب" });

    // Open the select and pick one of the existing trainers (same pattern as
    // district-select.test: stubbed pointer APIs let the Radix portal render).
    fireEvent.click(trainerCombo);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "Eng. Samir Hassan" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "تنزيل" }));

    expect(generateMutateMock).toHaveBeenCalledTimes(1);
    expect(generateMutateMock.mock.calls[0][0]).toEqual({
      key: "training_records",
      filters: { trainer: "Eng. Samir Hassan" },
    });
  });
});
