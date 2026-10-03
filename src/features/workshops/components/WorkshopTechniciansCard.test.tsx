import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "admin", fullName: "Admin", permissions: ["*"] },
  }),
  can: () => true,
}));

const mutateUpdate = vi.fn();

vi.mock("@/features/technicians", async () => {
  const actual = await vi.importActual<typeof import("@/features/technicians")>(
    "@/features/technicians"
  );
  return {
    ...actual,
    useTechnicians: () => ({
      data: {
        items: [
          {
            id: "t-1",
            fullName: "Ahmed Samir",
            fullNameAr: "أحمد سمير",
            nationalId: "30001011234567",
            mobile: "01012345678",
            workshopId: "w-1",
            workshopCode: "RAC-CAR-000001",
            specialty: "HVAC",
            yearsOfExperience: 5,
            status: "Active",
            notes: null,
            createdAtUtc: "2026-01-01T00:00:00Z",
          },
        ],
        page: 1,
        pageSize: 20,
        totalCount: 1,
      },
      isPending: false,
      isError: false,
    }),
    useUpdateTechnician: () => ({ mutate: mutateUpdate, isPending: false }),
    TechnicianDialog: ({ open }: { open: boolean }) =>
      open ? <div role="dialog">technician-dialog</div> : null,
  };
});

import { WorkshopTechniciansCard } from "./WorkshopTechniciansCard";
import { I18nProvider } from "@/shared/i18n";

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <WorkshopTechniciansCard
          workshopId="w-1"
          workshopCode="RAC-CAR-000001"
          workshopName="ورشة نصر"
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("WorkshopTechniciansCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mutateUpdate.mockClear();
  });

  it("lists workshop technicians and opens add dialog", async () => {
    renderCard();

    expect(await screen.findByText("أحمد سمير")).toBeInTheDocument();
    expect(screen.getByText("نشط")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /إضافة فني/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("technician-dialog");
  });

  it("confirms deactivate then PATCHes Inactive", async () => {
    renderCard();

    fireEvent.click(await screen.findByRole("button", { name: /إلغاء التنشيط/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/إلغاء تنشيط أحمد سمير/);

    fireEvent.click(within(dialog).getByRole("button", { name: /^إلغاء التنشيط$/ }));
    await waitFor(() =>
      expect(mutateUpdate).toHaveBeenCalledWith(
        { status: "Inactive" },
        expect.any(Object)
      )
    );
  });
});
