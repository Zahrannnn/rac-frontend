import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { PagedResult } from "@/shared/api/paged-result";
import type { AuthUser } from "@/features/auth";
import type { TrainingListItem } from "../types";

const { useTrainingsMock, refetchMock, pushMock, authUser } = vi.hoisted(() => ({
  useTrainingsMock: vi.fn(),
  refetchMock: vi.fn(),
  pushMock: vi.fn(),
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

vi.mock("../hooks/use-trainings", () => ({
  useTrainings: useTrainingsMock,
  useDeleteTraining: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateTraining: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTraining: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: authUser }),
  can: (permissions: readonly string[], key: string) =>
    permissions.includes("*") || permissions.includes(key),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { TrainingsPage } from "./TrainingsPage";

const training: TrainingListItem = {
  id: "tr-1",
  trainerName: "م. خالد فؤاد",
  title: "دورة التبريد الأساسية",
  venue: "قاعة القاهرة",
  governorate: "Cairo",
  startAtUtc: "2026-10-01T09:00:00Z",
  endAtUtc: "2026-10-01T13:00:00Z",
  attendeeCount: 12,
  photoCount: 3,
};

const trainingsPage = (items: TrainingListItem[]): PagedResult<TrainingListItem> => ({
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
        <TrainingsPage />
      </I18nProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authUser.permissions = ["*"];
  useTrainingsMock.mockReturnValue({
    data: trainingsPage([training]),
    isPending: false,
    isError: false,
    isPlaceholderData: false,
    refetch: refetchMock,
  });
});

describe("TrainingsPage", () => {
  it("renders the list in the shared DataTable with row navigation", async () => {
    renderPage();

    const table = screen.getByRole("table", { name: "سجلات التدريب" });
    expect(table).toBeInTheDocument();
    expect(await within(table).findByText("دورة التبريد الأساسية")).toBeInTheDocument();
    expect(within(table).getByText("قاعة القاهرة")).toBeInTheDocument();

    // Server-paged registry: headers carry no client sort controls.
    expect(within(table).queryByRole("button", { name: "العنوان" })).not.toBeInTheDocument();

    // Row click navigates to the detail route.
    fireEvent.click(within(table).getAllByRole("row")[1]);
    expect(pushMock).toHaveBeenCalledWith("/trainings/tr-1");
  });
});
