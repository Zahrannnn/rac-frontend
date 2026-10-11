import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { EquipmentDelivery } from "../types";
import type { AuthUser } from "@/features/auth";

const {
  useDeliveriesMock,
  useDeliveryMock,
  removeMutateMock,
  refetchMock,
  toastSuccessMock,
  toastErrorMock,
  authUser,
} = vi.hoisted(() => ({
    useDeliveriesMock: vi.fn(),
    useDeliveryMock: vi.fn(),
    removeMutateMock: vi.fn(),
    refetchMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
    authUser: {
      id: "u1",
      username: "admin",
      email: "admin@example.com",
      fullName: "Admin",
      role: "SuperAdmin",
      isActive: true,
      permissions: ["*"],
    } as AuthUser,
  }));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

vi.mock("../hooks/use-equipment", () => ({
  useDeliveries: useDeliveriesMock,
  useDelivery: useDeliveryMock,
  useDeleteDelivery: () => ({ mutate: removeMutateMock, isPending: false }),
  useDeliveryPhotos: () => ({ data: [] }),
  useDeliveryPhotoMutations: () => ({
    upload: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), isPending: false },
  }),
  useCreateDelivery: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateDelivery: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: authUser }),
  can: (permissions: readonly string[], key: string) =>
    permissions.includes("*") || permissions.includes(key),
}));

// DeliveryFormDialog loads its workshop picker from the selection feature —
// keep it inert so the page test never touches that query.
vi.mock("@/features/selection", () => ({
  useRecommendedCompanies: () => ({ data: undefined }),
}));

import { EquipmentDeliveriesPage } from "./EquipmentDeliveriesPage";

const delivery: EquipmentDelivery = {
  id: "d-1",
  workshopId: "w-1",
  workshopCode: "MAC-CAR-000125",
  workshopName: "ورشة النصر للتبريد",
  equipmentDescription: "ماكينة استرجاع وسيط التبريد",
  recipientName: "أحمد سمير",
  recipientPhone: "01012345678",
  deliveredAtUtc: "2026-10-01T10:30:00Z",
  deliveredBy: null,
  notes: null,
  photoCount: 2,
  createdAtUtc: "2026-10-01T11:00:00Z",
  updatedAtUtc: null,
};

const deliveriesPage = (items: EquipmentDelivery[]): PagedResult<EquipmentDelivery> => ({
  items,
  page: 1,
  pageSize: 20,
  totalCount: items.length,
});

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider>
        <EquipmentDeliveriesPage />
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authUser.permissions = ["*"];
  useDeliveriesMock.mockReturnValue({
    data: deliveriesPage([delivery]),
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    refetch: refetchMock,
  });
  useDeliveryMock.mockReturnValue({
    data: delivery,
    isPending: false,
    isError: false,
    refetch: refetchMock,
  });
});

describe("EquipmentDeliveriesPage", () => {
  it("renders five skeleton rows while the list is loading", () => {
    useDeliveriesMock.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isPlaceholderData: false,
      refetch: refetchMock,
    });

    const { container } = renderPage();

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("renders the retryable error state when the query fails", async () => {
    useDeliveriesMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      isPlaceholderData: false,
      refetch: refetchMock,
    });

    renderPage();

    expect(await screen.findByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();
  });

  it("shows the empty state with a create CTA when equipment:create is granted", async () => {
    useDeliveriesMock.mockReturnValue({
      data: deliveriesPage([]),
      isPending: false,
      isError: false,
      isPlaceholderData: false,
      refetch: refetchMock,
    });

    renderPage();

    expect(await screen.findByText("لا توجد تسليمات بعد")).toBeInTheDocument();
    expect(screen.getByText("سجّل تسليمًا لورشة موصى بها.")).toBeInTheDocument();
    // Header CTA + purposeful empty-state CTA.
    expect(screen.getAllByRole("button", { name: "تسليم جديد" })).toHaveLength(2);
  });

  it("hides the create CTAs without equipment:create", async () => {
    authUser.permissions = [];
    useDeliveriesMock.mockReturnValue({
      data: deliveriesPage([]),
      isPending: false,
      isError: false,
      isPlaceholderData: false,
      refetch: refetchMock,
    });

    renderPage();

    expect(await screen.findByText("لا توجد تسليمات بعد")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "تسليم جديد" })).not.toBeInTheDocument();
  });

  it("renders delivery rows with workshop identity and the delete icon action", async () => {
    renderPage();

    expect(await screen.findByText("MAC-CAR-000125")).toBeInTheDocument();
    expect(screen.getByText("ورشة النصر للتبريد")).toBeInTheDocument();
    expect(screen.getByText("ماكينة استرجاع وسيط التبريد")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "حذف" })).toBeInTheDocument();
  });

  it("hides the delete action and its column without equipment:delete", async () => {
    authUser.permissions = ["equipment:create"];
    renderPage();

    expect(await screen.findByText("MAC-CAR-000125")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "حذف" })).not.toBeInTheDocument();
    // Create stays available with only equipment:create.
    expect(screen.getByRole("button", { name: "تسليم جديد" })).toBeInTheDocument();
  });

  it("opens the detail dialog from the workshop identity cell button", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /MAC-CAR-000125/ }));

    expect(await screen.findByText("تفاصيل التسليم")).toBeInTheDocument();
    // Row cell + dialog description both carry the workshop code.
    expect(screen.getAllByText(/MAC-CAR-000125/).length).toBeGreaterThanOrEqual(2);
  });

  it("names the workshop in the delete confirmation copy", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "حذف" }));

    expect(
      await screen.findByText("حذف تسليم MAC-CAR-000125 · ورشة النصر للتبريد وصوره؟")
    ).toBeInTheDocument();
  });
});
