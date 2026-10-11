import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { SelectionRunSummary } from "../types";

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

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: { permissions: permissionsState.current } }),
  can: (permissions: string[], permission: string) =>
    permissions.includes("*") || permissions.includes(permission),
}));

vi.mock("@/shared/api/file-transfer", () => ({
  saveBlob: saveBlobMock,
}));

import { CurrentRunsCards } from "./CurrentRunsCards";

const permissionsState: { current: string[] } = { current: [] };

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

/** The card element containing a heading — Cards render as bordered divs. */
function cardOf(heading: RegExp | string): HTMLElement {
  const headingElement = screen.getByRole("heading", { name: heading });
  return headingElement.closest(".rounded-lg") as HTMLElement;
}

function renderCards(onRequestCreate = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <CurrentRunsCards onRequestCreate={onRequestCreate} />
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  exportMutateMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  saveBlobMock.mockReset();
  permissionsState.current = [];
  useSelectionRunsMock.mockReset();
  useSelectionRunsMock.mockReturnValue({
    data: runsPage([equipmentRun, participationRun]),
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
});

describe("CurrentRunsCards (current recommendation state)", () => {
  it("renders both cards populated from the latest run of each kind", async () => {
    renderCards();

    expect(
      await screen.findByRole("heading", { name: "التوصية الحالية — المشاركة" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "التوصية الحالية — المعدات" })
    ).toBeInTheDocument();

    const participationCard = cardOf("التوصية الحالية — المشاركة");
    const equipmentCard = cardOf("التوصية الحالية — المعدات");

    // Kind chips (text labels — never color alone) + counts + mono versions.
    expect(within(participationCard).getByText("مشاركة")).toBeInTheDocument();
    expect(
      within(participationCard).getByText("12 مُرتّبة · 12 موصى بها · 0 احتياطي")
    ).toBeInTheDocument();
    expect(within(participationCard).getByText("participation-v1")).toBeInTheDocument();
    expect(within(participationCard).getByText("بواسطة admin")).toBeInTheDocument();

    expect(within(equipmentCard).getByText("معدات")).toBeInTheDocument();
    expect(
      within(equipmentCard).getByText("12 مُرتّبة · 6 موصى بها · 2 احتياطي")
    ).toBeInTheDocument();
    expect(within(equipmentCard).getByText("equipment-v1")).toBeInTheDocument();

    // "View the list" deep-links to the ranked-list route of each latest run.
    expect(
      within(participationCard).getByRole("link", { name: "عرض القائمة" })
    ).toHaveAttribute("href", "/selection/runs/run-1");
    expect(
      within(equipmentCard).getByRole("link", { name: "عرض القائمة" })
    ).toHaveAttribute("href", "/selection/runs/run-2");
  });

  it("shows skeleton cards while the runs query is pending", () => {
    useSelectionRunsMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    });
    const { container } = renderCards();

    expect(container.querySelector("[aria-busy]")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /التوصية الحالية/ })).not.toBeInTheDocument();
  });

  it("renders the retryable error state when the runs query fails", async () => {
    useSelectionRunsMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch: vi.fn(),
    });
    renderCards();

    expect(await screen.findByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
  });

  it("exports the latest run of a kind via the outline action", async () => {
    exportMutateMock.mockImplementation(
      (_runId: string, options: { onSuccess: (payload: { blob: Blob; fileName: string }) => void }) =>
        options.onSuccess({ blob: new Blob(["xlsx"]), fileName: "selection-run.xlsx" })
    );
    renderCards();

    fireEvent.click(
      await within(cardOf("التوصية الحالية — المشاركة")).findByRole("button", {
        name: /تصدير Excel/,
      })
    );

    await waitFor(() => expect(exportMutateMock).toHaveBeenCalledWith("run-1", expect.anything()));
    expect(saveBlobMock).toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("تم تنزيل ملف Excel");
  });

  it("offers the compact new-run action only to selection:run holders", async () => {
    const onRequestCreate = vi.fn();
    permissionsState.current = ["selection:run"];
    renderCards(onRequestCreate);

    const newRunButtons = await screen.findAllByRole("button", { name: "تشغيلة جديدة" });
    expect(newRunButtons).toHaveLength(2);
    fireEvent.click(newRunButtons[0]);
    expect(onRequestCreate).toHaveBeenCalledWith("participation");
    fireEvent.click(newRunButtons[1]);
    expect(onRequestCreate).toHaveBeenCalledWith("equipment");
  });

  it("hides every create action without the selection:run permission", async () => {
    renderCards();

    expect(await screen.findByRole("heading", { name: "التوصية الحالية — المشاركة" }));
    expect(screen.queryByRole("button", { name: "تشغيلة جديدة" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /إنشاء تشغيلة/ })).not.toBeInTheDocument();
  });

  it("shows the participation empty card with a create CTA when no runs exist", async () => {
    permissionsState.current = ["selection:run"];
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    const onRequestCreate = vi.fn();
    renderCards(onRequestCreate);

    const participationCard = await cardOf("التوصية الحالية — المشاركة");
    expect(
      within(participationCard).getByText(
        "لم تُنشأ تشغيلة مشاركة بعد — عند إنشائها تُقيَّم جميع الورش ذات الاستبيان المكتمل وفق سلّم المشاركة وتُرتَّب في قائمتَي التوصية والاحتياط."
      )
    ).toBeInTheDocument();
    fireEvent.click(
      within(participationCard).getByRole("button", { name: /إنشاء تشغيلة مشاركة/ })
    );
    expect(onRequestCreate).toHaveBeenCalledWith("participation");
  });

  it("keeps the equipment empty card's CTA disabled with a hint until a participation run exists", async () => {
    permissionsState.current = ["selection:run"];
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCards();

    const equipmentCard = await cardOf("التوصية الحالية — المعدات");
    expect(
      within(equipmentCard).getByRole("button", { name: /إنشاء تشغيلة معدات/ })
    ).toBeDisabled();
    expect(
      within(equipmentCard).getByText("تتطلّب تشغيلة المعدات وجود تشغيلة مشاركة سابقة")
    ).toBeInTheDocument();
  });

  it("enables the equipment CTA once a participation run exists", async () => {
    permissionsState.current = ["selection:run"];
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([participationRun]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCards();

    const equipmentCard = await cardOf("التوصية الحالية — المعدات");
    expect(
      within(equipmentCard).getByRole("button", { name: /إنشاء تشغيلة معدات/ })
    ).toBeEnabled();
  });

  it("renders the empty-card explanations without CTAs for viewers", async () => {
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCards();

    expect(await screen.findByText(/لم تُنشأ تشغيلة مشاركة بعد/)).toBeInTheDocument();
    expect(screen.getByText(/لم تُنشأ تشغيلة معدات بعد/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /إنشاء تشغيلة/ })).not.toBeInTheDocument();
  });
});
