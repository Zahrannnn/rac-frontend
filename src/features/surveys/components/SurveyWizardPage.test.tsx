import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

/** Consent "yes" + Continue → lands on the basicInfo section page. */
async function openBasicInfo() {
  fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
  fireEvent.click(screen.getByRole("button", { name: "التالي" }));
  expect(
    await screen.findByRole("heading", { name: "البيانات الأساسية للورشة" })
  ).toBeInTheDocument();
}

function openToc() {
  fireEvent.click(screen.getByRole("button", { name: "قائمة الأقسام" }));
}

describe("SurveyWizardPage section-page navigation", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("starts on the consent section and gates Next until it is answered", () => {
    renderWizard();
    expect(screen.getByRole("heading", { name: "الموافقة على المشاركة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التالي" })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
    expect(screen.getByRole("button", { name: "التالي" })).toBeEnabled();
  });

  it("flushes the consent section via PUT when advancing to basicInfo", async () => {
    renderWizard();
    await openBasicInfo();

    await waitFor(() => expect(saveSection).toHaveBeenCalledWith({
      key: "consent",
      data: { "consent.participate": "yes" },
    }));

    // the whole basicInfo page renders at once — label + control on one page
    expect(screen.getByText("المحافظة")).toBeInTheDocument();
    expect(screen.getByText("المركز/الحي")).toBeInTheDocument();
  });

  it("keeps entered answers when jumping between sections from the TOC", async () => {
    renderWizard();
    await openBasicInfo();

    fireEvent.change(screen.getByLabelText("المركز/الحي"), { target: { value: "المعادي" } });

    // jump to workforce via the TOC drawer
    openToc();
    fireEvent.click(
      screen.getByRole("button", { name: "حجم النشاط والقوى العاملة — لم يبدأ" })
    );
    expect(await screen.findByRole("heading", { name: "حجم النشاط والقوى العاملة" })).toBeInTheDocument();

    // jump back — the district answer survives
    openToc();
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

describe("SurveyWizardPage autosave", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
    window.localStorage.clear();
  });

  it("fires a debounced saveSection ~1.5s after the last change", async () => {
    vi.useFakeTimers();
    try {
      renderWizard();

      fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
      expect(saveSection).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1600);
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(saveSection).toHaveBeenCalledWith({
        key: "consent",
        data: { "consent.participate": "yes" },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-schedules the debounce on every change (saves once, 1.5s after the last)", async () => {
    vi.useFakeTimers();
    try {
      renderWizard();

      fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      fireEvent.click(screen.getByRole("radio", { name: "لا" }));
      act(() => {
        vi.advanceTimersByTime(1000); // only 1s since the LAST change — must not fire
      });
      expect(saveSection).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(600);
      });
      await act(async () => {
        await Promise.resolve();
      });

      expect(saveSection).toHaveBeenCalledTimes(1);
      expect(saveSection).toHaveBeenCalledWith({
        key: "consent",
        data: { "consent.participate": "no" },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps answers dirty and shows a retry indicator when the save fails", async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderWizard();
      // fail the next save (403 is silent, so force a generic failure path)
      fireEvent.click(screen.getByRole("radio", { name: "نعم" }));
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      await act(async () => {
        await Promise.resolve();
      });
      // first save succeeded via the mock — now break the adapter and edit again
      saveSection.mockImplementationOnce(() => {
        throw new Error("network down");
      });
      // clear + retype keeps the section dirty; the retried flush hits the broken mock
      fireEvent.click(screen.getByRole("radio", { name: "لا" }));
      act(() => {
        vi.advanceTimersByTime(1600);
      });
      // mock threw inside mutateAsync — mutateAsync rejects
      await act(async () => {
        try {
          await Promise.resolve();
        } catch {
          // expected — error state
        }
      });
      // the retry affordance appears in the header
      expect(screen.getByText("تعذر الحفظ")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "إعادة المحاولة" })).toBeInTheDocument();

      // retry works once the adapter recovers
      fireEvent.click(screen.getByRole("button", { name: "إعادة المحاولة" }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(saveSection).toHaveBeenCalledWith({
        key: "consent",
        data: { "consent.participate": "no" },
      });
    } finally {
      consoleError.mockRestore();
      vi.useRealTimers();
    }
  });
});

describe("SurveyWizardPage resume", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
    window.localStorage.clear();
  });

  it("lands on consent on first open (no stored section)", () => {
    renderWizard();
    expect(screen.getByRole("heading", { name: "الموافقة على المشاركة" })).toBeInTheDocument();
  });

  it("reopens on the last-visited section of an interrupted survey", () => {
    window.localStorage.setItem("rac.survey.section.sv-1", "workforce");
    renderWizard();
    expect(
      screen.getByRole("heading", { name: "حجم النشاط والقوى العاملة" })
    ).toBeInTheDocument();
  });

  it("remembers the section being visited for the next open", async () => {
    renderWizard();
    await openBasicInfo();
    expect(window.localStorage.getItem("rac.survey.section.sv-1")).toBe("basicInfo");
  });
});

describe("SurveyWizardPage TOC completion states", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
    window.localStorage.clear();
  });

  it("shows per-section n/m answered counts (seeded context fields included)", async () => {
    renderWizard();
    await openBasicInfo();

    // 3 context fields (code/name/owner) are seeded + district = 4 of 14 countable
    fireEvent.change(screen.getByLabelText("المركز/الحي"), { target: { value: "المعادي" } });

    openToc();
    expect(screen.getByText("4/14")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "الموافقة على المشاركة — مكتمل" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "البيانات الأساسية للورشة — مُجاب 4 من 14" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "الإغلاق والموافقات — لم يبدأ" })
    ).toBeInTheDocument();
  });
});

describe("SurveyWizardPage new schema fields", () => {
  beforeEach(() => {
    saveSection.mockReset();
    push.mockReset();
    window.localStorage.clear();
  });

  it("renders serviceAreaM2 with helper text and inline validation", async () => {
    renderWizard();
    await openBasicInfo();

    const area = screen.getByLabelText("مساحة مركز الخدمة (م²)");
    expect(area).toBeInTheDocument();
    expect(screen.getByText("لا تقل عن ٢٥ مترًا مربعًا")).toBeInTheDocument();

    // touched + empty → required error
    fireEvent.change(area, { target: { value: "9" } });
    fireEvent.change(area, { target: { value: "" } });
    expect(screen.getByText("هذا الحقل مطلوب")).toBeInTheDocument();

    // zero violates the min — invalid-value error, cleared by a valid entry
    fireEvent.change(area, { target: { value: "0" } });
    expect(screen.getByText("القيمة غير صحيحة")).toBeInTheDocument();
    fireEvent.change(area, { target: { value: "120" } });
    expect(screen.queryByText("القيمة غير صحيحة")).not.toBeInTheDocument();
  });
});
