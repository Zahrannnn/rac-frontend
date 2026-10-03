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
    // invoke onSuccess so the wizard advances exactly like the real mutation
    mutate: (input: { key: string; data: unknown }, options?: { onSuccess?: () => void }) => {
      saveSection(input);
      options?.onSuccess?.();
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

describe("SurveyWizardPage step navigation + partial saves", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
  });

  it("starts on the consent step and requires an answer before advancing", () => {
    renderWizard();
    // Consent is field-walk (1 question)
    expect(screen.getByText("السؤال 1 من 1")).toBeInTheDocument();
    // Next is disabled until consent is answered
    expect(screen.getByRole("button", { name: "التالي" })).toBeDisabled();
  });

  it("saves the consent section via PUT when advancing", async () => {
    renderWizard();

    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));

    await waitFor(() => expect(saveSection).toHaveBeenCalledOnce());
    expect(saveSection).toHaveBeenCalledWith({
      key: "consent",
      data: { "consent.participate": "yes" },
    });

    // advanced to basicInfo — code/name/owner skipped; governorate is question 1 of 11
    expect(await screen.findByText("السؤال 1 من 11")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "المحافظة" })).toBeInTheDocument();
  });

  it("blocks advancing when a required simple field is empty", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    expect(await screen.findByText("السؤال 1 من 11")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "المحافظة" })).toBeInTheDocument();

    const savesBefore = saveSection.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    await waitFor(() =>
      expect(screen.getAllByText("هذا الحقل مطلوب").length).toBeGreaterThan(0)
    );
    expect(saveSection.mock.calls.length).toBe(savesBefore);
  });

  it("does not PUT basicInfo until the last field is advanced", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    fireEvent.click(screen.getByRole("button", { name: "التالي" }));
    await screen.findByText("السؤال 1 من 11");

    const consentPuts = saveSection.mock.calls.filter((c) => c[0].key === "consent").length;
    expect(consentPuts).toBe(1);

    expect(screen.getByRole("heading", { level: 3, name: "المحافظة" })).toBeInTheDocument();

    const basicInfoPuts = saveSection.mock.calls.filter((c) => c[0].key === "basicInfo").length;
    expect(basicInfoPuts).toBe(0);
  });
});
