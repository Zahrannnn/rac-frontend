import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { SelectionRunSummary } from "../types";

const { useSelectionRunsMock, createMutateMock, toastSuccessMock, toastErrorMock } = vi.hoisted(
  () => ({
    useSelectionRunsMock: vi.fn(),
    createMutateMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
  })
);

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

vi.mock("../hooks/use-selection", () => ({
  useSelectionRuns: useSelectionRunsMock,
  useSelectionRun: () => ({ data: undefined, isPending: false, isError: false, refetch: vi.fn() }),
  useCreateSelectionRun: () => ({ mutate: createMutateMock, isPending: false }),
  useExportSelectionRun: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: { permissions: permissionsState.current } }),
  can: (permissions: string[], permission: string) =>
    permissions.includes("*") || permissions.includes(permission),
}));

// RunDetailDialog renders inside the card; its own tests cover the detail view.
vi.mock("./RunDetailDialog", () => ({
  RunDetailDialog: () => null,
}));

import { SelectionRunsCard } from "./SelectionRunsCard";

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
  kind: "equipment",
  rubricVersion: "equipment-v1",
  rankedCount: 50,
  recommendedCount: 50,
  reserveCount: 10,
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
  createMutateMock.mockReset();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
  permissionsState.current = [];
  useSelectionRunsMock.mockReturnValue({
    data: runsPage([participationRun]),
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  });
});

describe("SelectionRunsCard", () => {
  it("hides both create actions without the selection:run permission", async () => {
    renderCard();

    expect(await screen.findByText("تشغيلات الاختيار")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /إنشاء تشغيلة مشاركة/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /إنشاء تشغيلة معدات/ })).not.toBeInTheDocument();
  });

  it("shows both create actions and kind chips with selection:run held", async () => {
    permissionsState.current = ["selection:run"];
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([participationRun, equipmentRun]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCard();

    expect(await screen.findByRole("button", { name: /إنشاء تشغيلة مشاركة/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /إنشاء تشغيلة معدات/ })).toBeEnabled();

    // Kind chips on the run rows (text labels — never color alone).
    expect(screen.getByText("مشاركة")).toBeInTheDocument();
    expect(screen.getByText("معدات")).toBeInTheDocument();
  });

  it("disables the equipment action with a hint until a participation run exists", async () => {
    permissionsState.current = ["selection:run"];
    useSelectionRunsMock.mockReturnValue({
      data: runsPage([]),
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderCard();

    expect(await screen.findByRole("button", { name: /إنشاء تشغيلة معدات/ })).toBeDisabled();
    expect(
      screen.getByText("تتطلب تشغيلة المعدات وجود تشغيلة مشاركة سابقة")
    ).toBeInTheDocument();
  });

  it("posts the run kind on confirm (participation)", async () => {
    permissionsState.current = ["selection:run"];
    createMutateMock.mockImplementation((_vars, options) => options.onSuccess());
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: /إنشاء تشغيلة مشاركة/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(createMutateMock).toHaveBeenCalledWith({ kind: "participation" }, expect.anything())
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("تم إنشاء تشغيلة الاختيار");
  });

  it("toasts the localized 409 reason when an equipment run has no participation gateway", async () => {
    permissionsState.current = ["selection:run"];
    createMutateMock.mockImplementation((_vars, options) =>
      options.onError({ status: 409, message: "No participation SelectionRun exists yet" })
    );
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: /إنشاء تشغيلة معدات/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "لا توجد تشغيلة مشاركة بعد — أنشئ تشغيلة مشاركة أولًا."
      )
    );
    // The English-only server detail is never surfaced raw.
    expect(toastErrorMock).not.toHaveBeenCalledWith(expect.stringContaining("SelectionRun"));
  });

  it("falls back to the generic failure toast for non-409 errors", async () => {
    permissionsState.current = ["selection:run"];
    createMutateMock.mockImplementation((_vars, options) =>
      options.onError({ status: 500, message: "boom" })
    );
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: /إنشاء تشغيلة مشاركة/ }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "تشغيل التقييم" }));

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith("تعذّر إنشاء تشغيلة الاختيار")
    );
  });
});
