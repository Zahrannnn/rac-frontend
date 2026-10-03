import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      username: "admin",
      fullName: "Super Admin",
      permissions: ["*"],
    },
  }),
}));

vi.mock("../hooks/use-workshops", () => ({
  useDuplicateCheck: () => ({ mutate: vi.fn() }),
  useCreateWorkshop: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { RegisterWorkshopPage } from "./RegisterWorkshopPage";
import { I18nProvider } from "@/shared/i18n";

function renderWizard() {
  return render(
    <I18nProvider>
      <RegisterWorkshopPage />
    </I18nProvider>
  );
}

const nextButton = () => screen.getByRole("button", { name: "التالي" });
const beginButton = () => screen.getByRole("button", { name: "ابدأ" });
const backButton = () => screen.getByRole("button", { name: "السابق" });

describe("RegisterWorkshopPage wizard navigation", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("starts on Identification showing the auto-generated code hint", () => {
    renderWizard();
    expect(screen.getByText("سيتم توليده تلقائيًا")).toBeInTheDocument();
    expect(screen.getByText("Super Admin")).toBeInTheDocument();
  });

  it("moves forward through all four steps and back again", async () => {
    renderWizard();

    // Step 1 → 2
    fireEvent.click(beginButton());
    expect(screen.getByLabelText(/اسم الورشة \(إنجليزي\)/)).toBeInTheDocument();

    // Step 2 requires valid fields before advancing
    fireEvent.change(screen.getByLabelText(/اسم الورشة \(إنجليزي\)/), {
      target: { value: "Nasr Workshop" },
    });
    fireEvent.change(screen.getByLabelText(/اسم المالك/), { target: { value: "Samir" } });
    fireEvent.change(screen.getByLabelText(/الجوال/), { target: { value: "01012345678" } });
    fireEvent.click(nextButton());

    // Step 3 → Location
    await waitFor(() => expect(screen.getByLabelText(/العنوان/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/العنوان/), { target: { value: "1 Tahrir Sq" } });
    fireEvent.click(nextButton());

    // Step 4 → Review shows the entered data
    expect(screen.getByText("Nasr Workshop")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إرسال الطلب" })).toBeInTheDocument();

    // Back returns through the steps
    fireEvent.click(backButton());
    expect(screen.getByLabelText(/العنوان/)).toBeInTheDocument();
  });

  it("blocks advancing from an invalid step and stays put", () => {
    renderWizard();
    fireEvent.click(beginButton());

    // On step 2 with empty required fields, Next must not advance
    fireEvent.click(nextButton());
    expect(screen.getByLabelText(/اسم الورشة \(إنجليزي\)/)).toBeInTheDocument();
  });
});
