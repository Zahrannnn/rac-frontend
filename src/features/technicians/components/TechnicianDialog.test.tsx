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

const editingTechnician: Technician = {
  id: "t-1",
  fullName: "احمد سمير",
  fullNameAr: null,
  mobile: "01012345678",
  workshopId: null,
  workshopCode: null,
  specialty: "مؤهل عالي",
  yearsOfExperience: 5,
  status: "Active",
  notes: null,
  // Manual identity (2026-11-17 NatID removal) — entered by hand, never derived.
  gender: "male",
  age: 41,
  employmentType: "engineer",
  employmentNature: null,
  hasModernRefrigerantExperience: null,
  employer: "ورشة النيل",
  address: "القاهرة",
  createdAtUtc: "2026-01-01T00:00:00Z",
};

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

  it("blocks saving with Arabic errors for an out-of-range age and phone", async () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    // Age outside 10–90 and a bad mobile prefix — both optional fields, but a
    // wrong value must block (blank stays legal).
    fireEvent.change(screen.getByRole("spinbutton", { name: /^العمر/ }), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01312345678" }, // invalid prefix
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() =>
      expect(screen.getByText(/أدخل سنًا بين ١٠ و ٩٠/)).toBeInTheDocument()
    );
    expect(screen.getByText(/أدخل رقم جوال مصري صحيح/)).toBeInTheDocument();
    expect(createMutate).not.toHaveBeenCalled();
  });

  it("accepts a valid form (manual gender and age, valid mobile)", async () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    // Gender select (FIRST combobox since the NatID removal): pick أنثى.
    fireEvent.keyDown(screen.getAllByRole("combobox")[0], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "أنثى" }), { key: "Enter" });
    fireEvent.change(screen.getByRole("spinbutton", { name: /^العمر/ }), {
      target: { value: "28" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });

    // Workshop is optional now: saving with none picked must not show the
    // old "اختر الورشة" required error and goes out as workshopId: null.
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ workshopId: null, gender: "female", age: 28 }),
      expect.anything()
    );
    expect(screen.queryByText(/اختر الورشة/)).not.toBeInTheDocument();
  });

  it("offers a بدون ورشة empty option and sends the id when a workshop is picked", async () => {
    renderDialog();

    // The workshop select is the form's FIFTH combobox — gender (manual since the
    // NatID removal), the §11 nature select, employment type and the
    // modern-experience select come first; specialty is last.
    const trigger = screen.getAllByRole("combobox")[4];
    // Keyboard is the reliable radix path in jsdom (pointer events need capture).
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    // The leading empty option marks free technicians (registered without a workshop).
    expect(await screen.findByRole("option", { name: "بدون ورشة" })).toBeInTheDocument();

    const workshopOption = await screen.findByRole("option", { name: /ورشة النصر/ });
    fireEvent.keyDown(workshopOption, { key: "Enter" });

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
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

  it("create omits blank gender and age from the payload (both optional)", async () => {
    renderDialog();

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "احمد سمير" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });
    // The age input is a manual entry field — enabled, empty by default.
    const ageInput = screen.getByRole("spinbutton", { name: /^العمر/ });
    expect(ageInput).toBeEnabled();
    expect(ageInput).toHaveValue(null);

    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    // The blank drafts ride as undefined — dropped at JSON serialization.
    const payload = createMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.gender).toBeUndefined();
    expect(payload.age).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("gender");
    expect(JSON.stringify(payload)).not.toContain('"age"');
  });
});

describe("TechnicianDialog registry attribute fields (REGISTRY-GAS-SPEC §2 + §11)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
  });

  it("renders the role select + address and submits them on create", async () => {
    renderDialog();

    // Employment-type select (third combobox — gender is first, the §11 nature
    // select second): pick مهندس.
    fireEvent.keyDown(screen.getAllByRole("combobox")[2], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "مهندس" }), { key: "Enter" });

    // §11 correction: no separate جهة العمل field — the workshop select IS the employer.
    fireEvent.change(screen.getByRole("textbox", { name: "العنوان" }), {
      target: { value: "القاهرة" },
    });

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "سارة محمود" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        employmentType: "engineer",
        address: "القاهرة",
      }),
      expect.anything()
    );
    // Employer never travels (§11 — the workshop select is the employer).
    const payload = createMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(payload)).not.toContain("employer");
  });

  it("renders the §11 nature + modern-experience selects and submits them on create", async () => {
    renderDialog();

    // Nature select (SECOND combobox — gender is first since the NatID removal;
    // checklist order 8 before الوظيفة): pick دائم.
    fireEvent.keyDown(screen.getAllByRole("combobox")[1], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "دائم" }), { key: "Enter" });

    // Modern-refrigerants select (fourth combobox): pick يوجد.
    fireEvent.keyDown(screen.getAllByRole("combobox")[3], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "يوجد" }), { key: "Enter" });

    fireEvent.change(screen.getByRole("textbox", { name: /^الاسم الكامل$/ }), {
      target: { value: "سارة محمود" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^الجوال/ }), {
      target: { value: "01012345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        employmentNature: "permanent",
        hasModernRefrigerantExperience: true,
      }),
      expect.anything()
    );
  });
});

describe("TechnicianDialog edit mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
  });

  it("edit form prefills the manual gender and age and PATCHes changes", async () => {
    renderDialog({ technician: editingTechnician });

    // Prefilled manual identity: ذكر selected in the gender select, 41 in the
    // enabled age input (both hand-entered, nothing disabled anymore).
    const ageInput = screen.getByRole("spinbutton", { name: /^العمر/ });
    expect(ageInput).toHaveValue(41);
    expect(ageInput).not.toBeDisabled();
    fireEvent.keyDown(screen.getAllByRole("combobox")[0], { key: "ArrowDown" });
    expect(
      await screen.findByRole("option", { name: "ذكر", selected: true })
    ).toBeInTheDocument();

    // Change both and PATCH — the new values travel.
    fireEvent.keyDown(await screen.findByRole("option", { name: "أنثى" }), { key: "Enter" });
    fireEvent.change(ageInput, { target: { value: "43" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ gender: "female", age: 43 }),
      expect.anything()
    );
    // The workshop link stays immutable — never part of the update payload.
    expect(updateMutate).toHaveBeenCalledWith(
      expect.not.objectContaining({ workshopId: expect.anything() }),
      expect.anything()
    );
  });

  it("edit form rejects an out-of-range age; cleared gender sends \"\" and blank age omits", async () => {
    renderDialog({ technician: editingTechnician });

    // Out-of-range age → Arabic error, no PATCH.
    const ageInput = screen.getByRole("spinbutton", { name: /^العمر/ });
    fireEvent.change(ageInput, { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() =>
      expect(screen.getByText(/أدخل سنًا بين ١٠ و ٩٠/)).toBeInTheDocument()
    );
    expect(updateMutate).not.toHaveBeenCalled();

    // A cleared gender draft travels as "" (the backend clears the stored value);
    // a blanked age omits the key (null = keep — no clear path).
    fireEvent.keyDown(screen.getAllByRole("combobox")[0], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "بدون تحديد" }), {
      key: "Enter",
    });
    fireEvent.change(ageInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const payload = updateMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.gender).toBe("");
    expect(payload).not.toHaveProperty("age");
  });

  it("keeps untouched registry fields off the PATCH and clears explicitly cleared ones", async () => {
    renderDialog({ technician: editingTechnician });

    // Address had a stored value; clearing the input travels as "" = clear.
    fireEvent.change(screen.getByRole("textbox", { name: "العنوان" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));

    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    const payload = updateMutate.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.address).toBe("");
    // Untouched unset registry fields (employmentNature is null on the technician)
    // ride as undefined — dropped at JSON serialization (keep). The untouched
    // stored gender/age (male/41) re-travel as no-op sets, the same convention as
    // address (manual identity, 2026-11-17); employer never travels (§11 — the
    // workshop select is the employer).
    expect(payload.employmentNature).toBeUndefined();
    expect(payload.gender).toBe("male");
    expect(payload.age).toBe(41);
    expect(JSON.stringify(payload)).not.toContain("employer");
  });
});
