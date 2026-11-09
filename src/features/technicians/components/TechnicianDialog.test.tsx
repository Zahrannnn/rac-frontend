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
    items: [
      { id: "w-1", code: "MAC-CAR-000001", nameEn: "Nasr Workshop", nameAr: "ورشة النصر" },
    ],
  }),
}));

const { createMutate, updateMutate } = vi.hoisted(() => ({
  createMutate: vi.fn(),
  updateMutate: vi.fn(),
}));

vi.mock("../hooks/use-technicians", () => ({
  useCreateTechnician: () => ({ mutate: createMutate, isPending: false }),
  useUpdateTechnician: () => ({ mutate: updateMutate, isPending: false }),
}));

import { TechnicianDialog } from "./TechnicianDialog";
import { I18nProvider } from "@/shared/i18n";
import type { Technician } from "../types";

function renderDialog(
  props?: {
    lockedWorkshopId?: string;
    lockedWorkshopLabel?: string;
    technician?: Technician | null;
  }
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TechnicianDialog
          open
          onOpenChange={vi.fn()}
          technician={props?.technician ?? null}
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
    // jsdom has no layout; the radix select scrolls the active option into view.
    Element.prototype.scrollIntoView = vi.fn();
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
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الرقم القومي/ }), {
      target: { value: "30001011234567" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });

    // Workshop is optional now: saving with none picked must not show the
    // old "اختر الورشة" required error and goes out as workshopId: null.
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ workshopId: null }),
      expect.anything()
    );
    expect(screen.queryByText(/اختر الورشة/)).not.toBeInTheDocument();
  });

  it("offers a بدون ورشة empty option and sends the id when a workshop is picked", async () => {
    renderDialog();

    // The workshop select is the form's first combobox (specialty is second);
    // FormField wires its id to the hidden radix bubble select, not the trigger.
    const trigger = screen.getAllByRole("combobox")[0];
    // Keyboard is the reliable radix path in jsdom (pointer events need capture).
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    // The leading empty option marks free technicians (registered without a workshop).
    expect(await screen.findByRole("option", { name: "بدون ورشة" })).toBeInTheDocument();

    const workshopOption = await screen.findByRole("option", { name: /ورشة النصر/ });
    fireEvent.keyDown(workshopOption, { key: "Enter" });

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الرقم القومي/ }), {
      target: { value: "30001011234567" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ workshopId: "w-1" }),
      expect.anything()
    );
  });

  it("locks workshop from workshop profile and skips the picker", async () => {
    const { fetchWorkshops } = await import("@/features/workshops/api/workshops-adapter");
    renderDialog({
      lockedWorkshopId: "w-1",
      lockedWorkshopLabel: "MAC-CAR-000001 — Nasr Workshop",
    });

    expect(screen.getByDisplayValue("MAC-CAR-000001 — Nasr Workshop")).toBeInTheDocument();
    expect(screen.queryByText(/اختر ورشة/)).not.toBeInTheDocument();
    expect(fetchWorkshops).not.toHaveBeenCalled();
  });
});

describe("TechnicianDialog edit mode", () => {
  const existing: Technician = {
    id: "t-1",
    fullName: "احمد سمير",
    fullNameAr: null,
    nationalId: "29801011234567",
    mobile: "01012345678",
    workshopId: null,
    workshopCode: null,
    specialty: "مؤهل عالي",
    yearsOfExperience: 5,
    status: "Active",
    notes: null,
    createdAtUtc: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
  });

  it("edits the national id — prefilled, no longer disabled, sent in the PATCH payload", async () => {
    renderDialog({ technician: existing });

    const nationalIdInput = screen.getByRole("textbox", { name: /^الرقم القومي/ });
    expect(nationalIdInput).toHaveValue("29801011234567");
    expect(nationalIdInput).not.toBeDisabled();

    fireEvent.change(nationalIdInput, { target: { value: "30001011234567" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ nationalId: "30001011234567" }),
      expect.anything()
    );
    // The workshop link stays immutable — never part of the update payload.
    expect(updateMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ workshopId: expect.anything() }),
      expect.anything()
    );
  });

  it("rejects a malformed edited national id with the Arabic message", async () => {
    renderDialog({ technician: existing });

    fireEvent.change(screen.getByRole("textbox", { name: /^الرقم القومي/ }), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() =>
      expect(screen.getByText(/الرقم القومي يجب أن يكون ١٤ رقمًا/)).toBeInTheDocument()
    );
    expect(updateMutate).not.toHaveBeenCalled();
  });
});
