import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { SelectionRunSummary } from "../types";
import { groupRunsForHistory } from "./SelectionRunsCard";

const { useSelectionRunsMock, exportMutateMock, toastSuccessMock, toastErrorMock, saveBlobMock } =
  vi.hoisted(() => ({
    useSelectionRunsMock: vi.fn(),
    exportMutateMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
    saveBlobMock: vi.fn(),
  }));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

vi.mock("../hooks/use-selection", () => ({
  useSelectionRuns: useSelectionRunsMock,
  useExportSelectionRun: () => ({ mutate: exportMutateMock, isPending: false }),
}));

vi.mock("@/shared/api/file-transfer", () => ({
  saveBlob: saveBlobMock,
}));

import { SelectionRunsCard } from "./SelectionRunsCard";

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

/** Newer than the participation run — an equipment run derived from it. */
const equipmentRun: SelectionRunSummary = {
  ...participationRun,
  id: "run-2",
  runAtUtc: "2026-10-05T10:00:00Z",
  kind: "equipment",
  rubricVersion: "equipment-v1",
  rankedCount: 12,
  recommendedCount: 6,
  reserveCount: 2,
};

const runsPage = (items: SelectionRunSummary[]): PagedResult<SelectionRunSummary> => ({
  items,
  page: 1,
  pageSize: 10,
  totalCount: items.length,
});

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <SelectionRunsCard />
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  exportMutateMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  saveBlobMock.mockReset();
  useSelectionRunsMock.mockReset();
  useSelectionRunsMock.mockReturnValue({
    data: runsPage([equipmentRun, participationRun]),
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
});

describe("groupRunsForHistory (audit-trail grouping)", () => {
  it("nests an equipment run under the most recent earlier participation run", () => {
    const olderParticipation = { ...participationRun, id: "run-0", runAtUtc: "2026-09-01T10:00:00Z" };
    const groups = groupRunsForHistory([equipmentRun, participationRun, olderParticipation]);

    expect(groups.map((group) => group.run.id)).toEqual(["run-1", "run-0"]);
    expect(groups[0].children.map((child) => child.id)).toEqual(["run-2"]);
    expect(groups[1].children).toEqual([]);
  });

  it("keeps an equipment run flat when its parent is outside the loaded page", () => {
    const groups = groupRunsForHistory([equipmentRun]);

    expect(groups).toEqual([{ run: equipmentRun, children: [] }]);
  });

  it("walks an equipment run that is newer than its parent first in the list", () => {
    // Newest-first list where the equipment run appears before its parent.
    const groups = groupRunsForHistory([equipmentRun, participationRun]);

    expect(groups.map((group) => group.run.id)).toEqual(["run-1"]);
    expect(groups[0].children.map((child) => child.id)).toEqual(["run-2"]);
  });
});

describe("SelectionRunsCard (compact run history)", () => {
  it("renders compact rows: kind chips, run-by, counts, mono version, view links", async () => {
    renderCard();

    expect(await screen.findByText("سجل التشغيلات")).toBeInTheDocument();
    expect(screen.getByText("مشاركة")).toBeInTheDocument();
    expect(screen.getByText("معدات")).toBeInTheDocument();
    expect(screen.getAllByText("بواسطة admin")).toHaveLength(2);
    expect(screen.getByText("12 مُرتّبة · 12 موصى بها · 0 احتياطي")).toBeInTheDocument();
    expect(screen.getByText("12 مُرتّبة · 6 موصى بها · 2 احتياطي")).toBeInTheDocument();
    expect(screen.getByText("participation-v1")).toBeInTheDocument();
    expect(screen.getByText("equipment-v1")).toBeInTheDocument();

    const viewLinks = screen.getAllByRole("link", { name: "عرض القائمة" });
    // Parent participation row first, its derived equipment run nested after it.
    expect(viewLinks.map((link) => link.getAttribute("href"))).toEqual([
      "/selection/runs/run-1",
      "/selection/runs/run-2",
    ]);
  });

  it("visually nests the equipment row under the participation run it derived from", async () => {
    renderCard();

    const participationRow = screen.getByText("مشاركة").closest("li");
    const equipmentRow = screen.getByText("معدات").closest("li");
    expect(participationRow).toContainElement(equipmentRow);
  });

  it("exports a row via the lightweight export action", async () => {
    exportMutateMock.mockImplementation(
      (_runId: string, options: { onSuccess: (payload: { blob: Blob; fileName: string }) => void }) =>
        options.onSuccess({ blob: new Blob(["xlsx"]), fileName: "selection-run.xlsx" })
    );
    renderCard();

    const exportButtons = await screen.findAllByRole("button", { name: "تصدير Excel" });
    expect(exportButtons).toHaveLength(2); // one per history row
    fireEvent.click(exportButtons[0]);

    // The parent participation row renders before its nested equipment row.
    await waitFor(() => expect(exportMutateMock).toHaveBeenCalledWith("run-1", expect.anything()));
    expect(saveBlobMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("تم تنزيل ملف Excel");
  });

  it("keeps 10-per-page pagination and refetches by page number", async () => {
    useSelectionRunsMock.mockReturnValue({
      data: runsPage(Array.from({ length: 12 }, (_, i) => ({ ...participationRun, id: `run-${i}` }))),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCard();

    const next = await screen.findByRole("button", { name: "التالي" });
    fireEvent.click(next);

    await waitFor(() => expect(useSelectionRunsMock).toHaveBeenLastCalledWith(2));
  });

  it("shows the purposeful empty state with no create buttons (the cards own creation)", async () => {
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCard();

    expect(
      await screen.findByText(
        "تشغيلة الاختيار ترتيبٌ آلي للورش وفق سلّم تقييم مُعتمد، وتُحفظ نتيجتها كلقطة غير قابلة للتعديل."
      )
    ).toBeInTheDocument();

    // History explains only — the recommendation cards above carry the CTAs,
    // so a runs-less page never stacks duplicate create buttons.
    expect(screen.queryByRole("button", { name: /إنشاء تشغيلة مشاركة/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /إنشاء تشغيلة معدات/ })).not.toBeInTheDocument();
  });

  it("renders the retryable error state when the runs query fails", async () => {
    useSelectionRunsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });
    renderCard();

    expect(await screen.findByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
  });
});
