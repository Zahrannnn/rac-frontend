import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type {
  DashboardSummary,
  ExecutiveDashboardSummary,
  FullDashboardSummary,
} from "@/features/dashboard";
import type { SelectionRunSummary } from "../types";

const {
  useSelectionRunsMock,
  createMutateMock,
  useDashboardSummaryMock,
  isFullSummaryMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  useSelectionRunsMock: vi.fn(),
  createMutateMock: vi.fn(),
  useDashboardSummaryMock: vi.fn(),
  // Mirrors the real guard: full shape ⇢ "totalTechnicians" (no role checks).
  isFullSummaryMock: (summary: DashboardSummary) => "totalTechnicians" in summary,
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

vi.mock("../hooks/use-selection", () => ({
  useSelectionRuns: useSelectionRunsMock,
  useCreateSelectionRun: () => ({ mutate: createMutateMock, isPending: false }),
}));

vi.mock("@/features/dashboard", () => ({
  useDashboardSummary: useDashboardSummaryMock,
  isFullSummary: isFullSummaryMock,
}));

import { RunCreateConfirm } from "./RunCreateConfirm";

const participationRun: SelectionRunSummary = {
  id: "run-1",
  runAtUtc: "2026-10-01T10:00:00Z",
  runByUserId: null,
  runByUsername: "admin",
  kind: "participation",
  rubricVersion: "participation-v1",
  rankedCount: 12,
  recommendedCount: 12,
  reserveCount: 0,
  notes: null,
};

const fullSummary: FullDashboardSummary = {
  totalWorkshops: 10,
  totalTechnicians: 8,
  workshopsLast30Days: 3,
  byStatus: [],
  byGovernorate: [],
  // The machine re-scores every Complete survey — the live count reads this
  // total, with attention.awaitingSelectionCount only as the "new since" delta.
  surveys: [
    { workshopId: "w-1", workshopCode: "MAC-CAR-000001", status: "Complete", failingRules: 0 },
    { workshopId: "w-2", workshopCode: "MAC-CAR-000002", status: "Complete", failingRules: 0 },
    { workshopId: "w-3", workshopCode: "MAC-CAR-000003", status: "Submitted", failingRules: 2 },
  ],
  pulse: { rankedCount: 5, recommendedTarget: 150 },
  attention: { incompleteFailing: 0, stuckDrafts: 0, awaitingSelectionCount: 1 },
};

const executiveSummary: ExecutiveDashboardSummary = {
  totalWorkshops: 10,
  byStatus: [],
  byGovernorate: [],
  pulse: { rankedCount: 5, recommendedTarget: 150 },
};

const runsPage = (items: SelectionRunSummary[]): PagedResult<SelectionRunSummary> => ({
  items,
  page: 1,
  pageSize: 10,
  totalCount: items.length,
});

function renderConfirm(kind: "participation" | "equipment") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <RunCreateConfirm kind={kind} open onOpenChange={vi.fn()} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  createMutateMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  useSelectionRunsMock.mockReset();
  useSelectionRunsMock.mockReturnValue({
    data: runsPage([participationRun]),
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  useDashboardSummaryMock.mockReset();
  useDashboardSummaryMock.mockReturnValue({
    data: fullSummary,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
});

describe("RunCreateConfirm (kind-aware confirmation)", () => {
  it("sizes the participation count from the completed total, with the delta as a suffix", async () => {
    renderConfirm("participation");

    expect(
      await screen.findByText(
        "سيُقيَّم 2 ورشة باستبيان مكتمل، منها 1 جديدة منذ آخر تشغيلة"
      )
    ).toBeInTheDocument();
  });

  it("drops the delta suffix when nothing is new since the latest run", async () => {
    useDashboardSummaryMock.mockReturnValue({
      data: {
        ...fullSummary,
        attention: { incompleteFailing: 0, stuckDrafts: 0, awaitingSelectionCount: 0 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderConfirm("participation");

    expect(
      await screen.findByText("سيُقيَّم 2 ورشة باستبيان مكتمل")
    ).toBeInTheDocument();
  });

  it("stays silent for other dashboard role shapes", async () => {
    useDashboardSummaryMock.mockReturnValue({
      data: executiveSummary,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderConfirm("participation");

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/تُقيّم آلة سلّم المشاركة/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/سيُقيَّم \d+ ورشة/)).not.toBeInTheDocument();
  });

  it("stays silent while the dashboard summary is pending", async () => {
    useDashboardSummaryMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });
    renderConfirm("participation");

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/سيُقيَّم \d+ ورشة/)).not.toBeInTheDocument();
  });

  it("sizes the equipment confirm from the latest participation run's recommended count", async () => {
    renderConfirm("equipment");

    expect(
      await screen.findByText(
        "ستُقيَّم القائمة الموصى بها من أحدث تشغيلة مشاركة (12 ورشة)"
      )
    ).toBeInTheDocument();
  });

  it("omits the equipment live count when no participation run exists", async () => {
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderConfirm("equipment");

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/ستُقيَّم القائمة الموصى بها/)).not.toBeInTheDocument();
  });

  it("posts the run kind on confirm (participation)", async () => {
    createMutateMock.mockImplementation((_vars, options) => options.onSuccess());
    renderConfirm("participation");

    fireEvent.click(await screen.findByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(createMutateMock).toHaveBeenCalledWith({ kind: "participation" }, expect.anything())
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("تم إنشاء تشغيلة الاختيار");
  });

  it("toasts the localized 409 reason when an equipment run has no participation gateway", async () => {
    createMutateMock.mockImplementation((_vars, options) =>
      options.onError({ status: 409, message: "No participation SelectionRun exists yet" })
    );
    renderConfirm("equipment");

    fireEvent.click(await screen.findByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "لا توجد تشغيلة مشاركة بعد. أنشئ تشغيلة مشاركة أولًا."
      )
    );
    // The English-only server detail is never surfaced raw.
    expect(toastErrorMock).not.toHaveBeenCalledWith(expect.stringContaining("SelectionRun"));
  });

  it("toasts the localized 409 reason when a participation run has nothing to rank", async () => {
    createMutateMock.mockImplementation((_vars, options) =>
      options.onError({ status: 409, message: "No workshop has a Complete survey" })
    );
    renderConfirm("participation");

    fireEvent.click(await screen.findByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "لا توجد ورش باستبيان مكتمل لتقسيمها. يصبح الاستبيان مكتملًا باجتياز التحقق التلقائي."
      )
    );
  });

  it("falls back to the generic failure toast for non-409 errors", async () => {
    createMutateMock.mockImplementation((_vars, options) =>
      options.onError({ status: 500, message: "boom" })
    );
    renderConfirm("participation");

    fireEvent.click(await screen.findByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("تعذّر إنشاء تشغيلة الاختيار")
    );
  });
});
