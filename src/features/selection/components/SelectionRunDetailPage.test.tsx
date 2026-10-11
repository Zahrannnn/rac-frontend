import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { SelectionRunDetail, SelectionRunRankedRow } from "../types";

const { useSelectionRunMock, exportMutateMock, useScorecardMock, toastSuccessMock, saveBlobMock } =
  vi.hoisted(() => ({
    useSelectionRunMock: vi.fn(),
    exportMutateMock: vi.fn(),
    useScorecardMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    saveBlobMock: vi.fn(),
  }));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: vi.fn() },
}));

vi.mock("../hooks/use-selection", () => ({
  useSelectionRun: useSelectionRunMock,
  useExportSelectionRun: () => ({ mutate: exportMutateMock, isPending: false }),
  useScorecard: useScorecardMock,
}));

vi.mock("@/shared/api/file-transfer", () => ({
  saveBlob: saveBlobMock,
}));

import { SelectionRunDetailPage } from "./SelectionRunDetailPage";

const rankedRow = (over: Partial<SelectionRunRankedRow>): SelectionRunRankedRow => ({
  rank: 1,
  rankInGovernorate: 1,
  workshopId: "w-1",
  workshopCode: "MAC-CAR-000042",
  workshopName: "ورشة النور",
  governorate: "Cairo",
  totalScore: 88,
  tier: "recommended",
  criteria: [],
  ...over,
});

const first = rankedRow({});
const second = rankedRow({
  rank: 2,
  workshopId: "w-2",
  workshopCode: "MAC-CAR-000043",
  workshopName: "ورشة الأمل",
  governorate: "Giza",
  totalScore: 81,
});
const reserveRow = rankedRow({
  rank: 3,
  workshopId: "w-3",
  workshopCode: "MAC-CAR-000044",
  workshopName: "ورشة السلام",
  governorate: "Alexandria",
  totalScore: 70,
  tier: "reserve",
});

const runDetail: SelectionRunDetail = {
  id: "run-1",
  runAtUtc: "2026-10-01T10:00:00Z",
  runByUserId: null,
  runByUsername: "admin",
  kind: "participation",
  rubricVersion: "participation-v1",
  rankedCount: 3,
  recommendedCount: 2,
  reserveCount: 1,
  notes: null,
  rubric: { version: "participation-v1", kind: "Participation", maxTotal: 100, criteria: [] },
  recommended: [first, second],
  reserve: [reserveRow],
  ranked: [first, second, reserveRow],
};

function renderPage(runId = "run-1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <SelectionRunDetailPage runId={runId} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  exportMutateMock.mockReset();
  toastSuccessMock.mockReset();
  saveBlobMock.mockReset();
  useSelectionRunMock.mockReset();
  useScorecardMock.mockReset();
  useSelectionRunMock.mockReturnValue({
    data: runDetail,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
  useScorecardMock.mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe("SelectionRunDetailPage (ranked list of one run snapshot)", () => {
  it("links back to /selection and renders the run header meta", async () => {
    renderPage();

    expect(screen.getByRole("link", { name: "العودة إلى الاختيار" })).toHaveAttribute(
      "href",
      "/selection"
    );

    const section = await screen.findByRole("region");
    expect(within(section).getByText("مشاركة")).toBeInTheDocument(); // kind chip
    expect(within(section).getByText("بواسطة admin")).toBeInTheDocument();
    expect(within(section).getByText("3 مُرتّبة · 2 موصى بها · 1 احتياطي")).toBeInTheDocument();
    expect(within(section).getByText("إصدار سلّم التقييم: participation-v1")).toBeInTheDocument();
    expect(within(section).getByText(/بانتظار قرار البرنامج/)).toBeInTheDocument(); // off-platform hint
  });

  it("renders the recommended tier rows: rank, workshop + mono code, governorate, score, tier badge", async () => {
    renderPage();

    const recommended = await screen.findByRole("tabpanel");
    expect(within(recommended).getByText("#1")).toBeInTheDocument();
    expect(within(recommended).getByText("#2")).toBeInTheDocument();
    expect(within(recommended).getByText("ورشة النور")).toBeInTheDocument();
    expect(within(recommended).getByText("MAC-CAR-000042")).toBeInTheDocument();
    expect(within(recommended).getByText("القاهرة")).toBeInTheDocument();
    expect(within(recommended).getByText("الجيزة")).toBeInTheDocument();
    expect(within(recommended).getAllByText("88")).toHaveLength(1);
    expect(within(recommended).getAllByText("موصى بها").length).toBeGreaterThan(0);
    expect(within(recommended).queryByText("ورشة السلام")).not.toBeInTheDocument();
  });

  it("switches to the reserve tier tab", async () => {
    renderPage();

    // Radix tab triggers activate on mousedown (automatic activation mode).
    fireEvent.mouseDown(await screen.findByRole("tab", { name: "قائمة الاحتياط (1)" }));

    const reserve = await screen.findByRole("tabpanel", { name: "قائمة الاحتياط (1)" });
    expect(within(reserve).getByText("ورشة السلام")).toBeInTheDocument();
    expect(within(reserve).getAllByText("احتياطي").length).toBeGreaterThan(0);
  });

  it("opens the scorecard dialog from a row action", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "بطاقة تقييم ورشة النور" })
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("بطاقة التقييم الآلي")).toBeInTheDocument();
  });

  it("exports the snapshot via the outline action", async () => {
    exportMutateMock.mockImplementation(
      (_runId: string, options: { onSuccess: (payload: { blob: Blob; fileName: string }) => void }) =>
        options.onSuccess({ blob: new Blob(["xlsx"]), fileName: "selection-run.xlsx" })
    );
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /تصدير Excel/ }));

    await waitFor(() => expect(exportMutateMock).toHaveBeenCalledWith("run-1", expect.anything()));
    expect(saveBlobMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("تم تنزيل ملف Excel");
  });

  it("renders the retryable error state for an invalid or failed runId — no crash", async () => {
    useSelectionRunMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });
    renderPage("not-a-real-run");

    expect(await screen.findByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders skeletons while the run loads", () => {
    useSelectionRunMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });
    const { container } = renderPage();

    expect(container.querySelector("[aria-busy]")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
