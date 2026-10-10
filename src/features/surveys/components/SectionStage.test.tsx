import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { SECTIONS } from "../schema";
import { SectionStage } from "./SectionStage";

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("SectionStage (one scrollable section page)", () => {
  it("renders an axis section as a full-width likert block with guidance", () => {
    const section = SECTIONS.find((candidate) => candidate.key === "orgManagement")!;

    renderWithI18n(
      <SectionStage
        section={section}
        answers={{}}
        onChange={vi.fn()}
        touchedFields={[]}
        howToFill="حدّد إجابة واحدة في كل صف"
      />
    );

    expect(screen.getByText("حدّد إجابة واحدة في كل صف")).toBeInTheDocument();
    expect(
      screen.getByText("تحتفظ إدارة الورشة بسجلات منتظمة لعمليات الصيانة والإصلاح.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(18);
  });

  it("renders a mixed section in paper order: simple cards inline + complex blocks full-width", () => {
    const section = SECTIONS.find((candidate) => candidate.key === "workforce")!;

    renderWithI18n(
      <SectionStage
        section={section}
        answers={{}}
        onChange={vi.fn()}
        touchedFields={[]}
        howToFill="حدّد إجابة واحدة في كل صف"
      />
    );

    // complex blocks present (workforce matrix + seasonal volume + refrigerants + 3col ranges)
    expect(screen.getByText("القوى العاملة (عدد الأفراد)")).toBeInTheDocument();
    expect(screen.getByText("متوسط السيارات المخدومة شهريًا")).toBeInTheDocument();
    // simple field cards present on the same page
    expect(screen.getByText("متوسط خبرة الفنيين")).toBeInTheDocument();
    expect(screen.getByText("هل رُصد غاز مختلط؟")).toBeInTheDocument();
  });

  it("shows an inline error for a touched invalid required field only", () => {
    const section = SECTIONS.find((candidate) => candidate.key === "workforce")!;

    renderWithI18n(
      <SectionStage
        section={section}
        answers={{}}
        onChange={vi.fn()}
        touchedFields={["avgTechnicianExperience"]}
        howToFill="حدّد إجابة واحدة في كل صف"
      />
    );

    expect(screen.getByText("هذا الحقل مطلوب")).toBeInTheDocument();
    // untouched required fields stay quiet — free navigation, no wall of red
    expect(screen.getAllByText("هذا الحقل مطلوب")).toHaveLength(1);
  });

  it("renders the interview date as a calendar date picker (Arabic locale)", async () => {
    const section = SECTIONS.find((candidate) => candidate.key === "closing")!;
    const onChange = vi.fn();

    renderWithI18n(
      <SectionStage
        section={section}
        answers={{}}
        onChange={onChange}
        touchedFields={[]}
        howToFill="أكمل بيانات الختام"
      />
    );

    // the date field renders the shared DatePicker trigger, not a free-text input
    const trigger = screen.getByRole("button", { name: "اختر تاريخًا" });
    expect(trigger).toBeInTheDocument();

    fireEvent.click(trigger);
    await waitFor(() => {
      // react-day-picker grid with Arabic month caption (October 2026)
      const caption = screen.getByText(/أكتوبر|٢٠٢٦/, { exact: false });
      expect(caption).toBeInTheDocument();
    });
    const dayButton = screen
      .getAllByRole("gridcell")
      .map((cell) => cell.querySelector("button"))
      .filter((button): button is HTMLButtonElement => button !== null)[0];
    expect(dayButton).toBeTruthy();
    fireEvent.click(dayButton!);
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        "date",
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      )
    );
  });
});
