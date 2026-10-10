import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const push = vi.fn();
const saveSection = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "field.demo", fullName: "Field Demo", permissions: ["*"] },
  }),
  can: () => true,
}));

vi.mock("@/features/workshops/hooks/use-workshops", () => ({
  useWorkshop: () => ({
    data: {
      id: "w-1",
      code: "RAC-CAR-000009",
      nameEn: "Nasr Workshop",
      nameAr: "ورشة نصر",
      ownerName: "أحمد سمير",
    },
    isPending: false,
  }),
}));

vi.mock("../hooks/use-survey", () => ({
  useSurvey: () => ({
    data: {
      id: "sv-1",
      workshopId: "w-1",
      workshopCode: "RAC-CAR-000009",
      status: "Draft",
      latitude: null,
      longitude: null,
      gpsRecordedAtUtc: null,
      submittedAtUtc: null,
      submittedBy: null,
      sections: {},
      photoCount: 0,
      createdAtUtc: "2026-09-18T00:00:00Z",
      completedAtUtc: null,
      validation: [],
    },
    isPending: false,
    isError: false,
  }),
  useStartSurvey: () => ({ mutate: vi.fn(), isPending: false }),
  useSaveSection: () => ({
    mutate: (input: { key: string; data: unknown }) => {
      saveSection(input);
    },
    mutateAsync: async (input: { key: string; data: unknown }) => {
      saveSection(input);
      return input;
    },
    isPending: false,
  }),
  useRecordGps: () => ({ mutate: vi.fn(), isPending: false }),
  useSubmitSurvey: () => ({ mutate: vi.fn(), isPending: false }),
  useSurveyPhotos: () => ({ data: [], isPending: false }),
  usePhotoMutations: () => ({
    upload: { mutate: vi.fn(), isPending: false },
    remove: { mutate: vi.fn(), isPending: false },
  }),
}));

import { SurveyWizardPage } from "./SurveyWizardPage";
import { I18nProvider } from "@/shared/i18n";

function renderWizard() {
  return render(
    <I18nProvider>
      <SurveyWizardPage workshopId="w-1" />
    </I18nProvider>
  );
}

describe("SurveyWizardPage section-page navigation", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
    window.localStorage.clear();
  });

  it("starts on the consent section and gates Next until it is answered", () => {
    renderWizard();
    expect(screen.getByRole("heading", { name: "الموافقة على المشاركة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التالي" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    expect(screen.getByRole("button", { name: "التالي" })).toBeEnabled();
  });

  it("saves the consent section via PUT when advancing to basicInfo", async () => {
    renderWizard();

    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    await waitFor(() => expect(saveSection).toHaveBeenCalledWith({
      key: "consent",
      data: { "consent.participate": "yes" },
    }));

    // the whole basicInfo page renders at once — label + control on one page
    expect(
      await screen.findByRole("heading", { name: "البيانات الأساسية للورشة" })
    ).toBeInTheDocument();
    expect(screen.getByText("المحافظة")).toBeInTheDocument();
    expect(screen.getByText("المركز/الحي")).toBeInTheDocument();
  });

  it("keeps entered answers when jumping between sections from the TOC", async () => {
    renderWizard();

    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(await screen.findByRole("heading", { name: "البيانات الأساسية للورشة" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("المركز/الحي"), { target: { value: "المعادي" } });

    // jump to workforce via the TOC drawer
    fireEvent.click(screen.getByRole("button", { name: "قائمة الأقسام" }));
    fireEvent.click(
      screen.getByRole("button", { name: "حجم النشاط والقوى العاملة — لم يبدأ" })
    );
    expect(await screen.findByRole("heading", { name: "حجم النشاط والقوى العاملة" })).toBeInTheDocument();

    // jump back — the district answer survives
    fireEvent.click(screen.getByRole("button", { name: "قائمة الأقسام" }));
    fireEvent.click(
      screen.getByRole("button", { name: /^البيانات الأساسية للورشة —/ })
    );
    expect(await screen.findByLabelText("المركز/الحي")).toHaveValue("المعادي");
  });

  it("keeps the consent decline gate: only way forward is review", async () => {
    renderWizard();

    fireEvent.click(screen.getByRole("radio", { name: "لا" }));
    expect(screen.queryByRole("button", { name: "التالي" })).not.toBeInTheDocument();
    expect(screen.getByText("شكرًا لوقتكم — تم إنهاء المقابلة")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "الانتقال إلى الإرسال" }));
    expect(
      await screen.findByRole("heading", { name: "مراجعة الأقسام قبل الإرسال" })
    ).toBeInTheDocument();
  });
});
