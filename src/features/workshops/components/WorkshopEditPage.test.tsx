import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const push = vi.fn();
const mutate = vi.fn();

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

import { WorkshopEditPage } from "./WorkshopEditPage";
import { I18nProvider } from "@/shared/i18n";
import type { Workshop } from "../types";

const workshop: Workshop = {
  id: "w1",
  code: "RAC-CAR-000125",
  nameEn: "Nasr Workshop",
  nameAr: "ورشة النصر",
  ownerName: "سمير",
  mobile: "01012345678",
  telephone: null,
  address: "1 Tahrir Sq",
  governorate: "Cairo",
  district: null,
  type: "Formal",
  status: "Draft",
  flags: "None",
  activities: null,
  numberOfTechnicians: 4,
  latitude: null,
  longitude: null,
  notes: null,
  createdAtUtc: "2026-01-01T00:00:00Z",
  updatedAtUtc: null,
};

vi.mock("../hooks/use-workshops", () => ({
  useWorkshop: () => ({ data: workshop, isPending: false, isError: false }),
  useUpdateWorkshop: () => ({ mutate, isPending: false }),
}));

function renderEditPage() {
  return render(
    <I18nProvider>
      <WorkshopEditPage workshopId={workshop.id} />
    </I18nProvider>
  );
}

const nameEnInput = () => screen.getByLabelText(/اسم الورشة \(إنجليزي\)/) as HTMLInputElement;
const saveButton = () => screen.getByRole("button", { name: "حفظ" });

describe("WorkshopEditPage (dedicated edit route)", () => {
  beforeEach(() => {
    push.mockReset();
    mutate.mockReset();
  });

  it("mounts the edit form pre-filled from the workshop with a back link to the profile", () => {
    renderEditPage();

    expect(screen.getByRole("heading", { level: 1, name: "تعديل بيانات الورشة" }))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: /العودة إلى صفحة الورشة/ })).toHaveAttribute(
      "href",
      "/workshops/w1"
    );
    expect(nameEnInput().value).toBe("Nasr Workshop");
    expect((screen.getByLabelText(/الجوال/) as HTMLInputElement).value).toBe("01012345678");
  });

  it("submits the update payload on save", () => {
    renderEditPage();

    fireEvent.change(nameEnInput(), { target: { value: "Nasr Workshop Updated" } });
    fireEvent.click(saveButton());

    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      nameEn: "Nasr Workshop Updated",
      mobile: "01012345678",
      governorate: "Cairo",
      confirmDuplicate: false,
    });
  });

  it("redirects to the workshop profile after a successful save", () => {
    renderEditPage();
    fireEvent.click(saveButton());

    const { onSuccess } = mutate.mock.calls[0][1] as { onSuccess: () => void };
    onSuccess();

    expect(push).toHaveBeenCalledWith("/workshops/w1");
  });

  it("blocks submit and keeps the user on the page when a required field is cleared", () => {
    renderEditPage();

    fireEvent.change(nameEnInput(), { target: { value: "" } });
    fireEvent.click(saveButton());

    expect(mutate).not.toHaveBeenCalled();
    expect(nameEnInput()).toBeInTheDocument();
  });
});
