import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "admin", fullName: "Admin", permissions: ["*"] },
  }),
  can: () => true,
}));

vi.mock("@/features/workshops/api/workshops-adapter", () => ({
  fetchWorkshops: vi.fn().mockResolvedValue({
    items: [{ id: "w-1", code: "RAC-CAR-000001", name: "Nasr Workshop" }],
  }),
}));

vi.mock("../hooks/use-technicians", () => ({
  useCreateTechnician: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTechnician: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { TechnicianDialog } from "./TechnicianDialog";
import { I18nProvider } from "@/shared/i18n";

function renderDialog(props?: { lockedWorkshopId?: string; lockedWorkshopLabel?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TechnicianDialog
          open
          onOpenChange={vi.fn()}
          technician={null}
          lockedWorkshopId={props?.lockedWorkshopId}
          lockedWorkshopLabel={props?.lockedWorkshopLabel}
        />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("TechnicianDialog validation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("blocks saving with Arabic errors for an invalid national ID and phone", async () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الرقم القومي/ }), {
      target: { value: "123" }, // too short, wrong prefix
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01312345678" }, // invalid prefix
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() =>
      expect(screen.getByText(/الرقم القومي يجب أن يكون ١٤ رقمًا/)).toBeInTheDocument()
    );
    expect(screen.getByText(/أدخل رقم جوال مصري صحيح/)).toBeInTheDocument();
  });

  it("accepts a valid form (national ID 14 digits starting 2/3, valid mobile)", async () => {
    const { fetchWorkshops } = await import("@/features/workshops/api/workshops-adapter");
    renderDialog();

    await waitFor(() => expect(fetchWorkshops).toHaveBeenCalled());

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الرقم القومي/ }), {
      target: { value: "30001011234567" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });

    // The radix Select keeps workshopId empty in jsdom → the workshop error must show
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    expect(await screen.findByText(/اختر الورشة/)).toBeInTheDocument();
  });

  it("locks workshop from workshop profile and skips the picker", async () => {
    const { fetchWorkshops } = await import("@/features/workshops/api/workshops-adapter");
    renderDialog({
      lockedWorkshopId: "w-1",
      lockedWorkshopLabel: "RAC-CAR-000001 — Nasr Workshop",
    });

    expect(screen.getByDisplayValue("RAC-CAR-000001 — Nasr Workshop")).toBeInTheDocument();
    expect(screen.queryByText(/اختر ورشة/)).not.toBeInTheDocument();
    expect(fetchWorkshops).not.toHaveBeenCalled();
  });
});
