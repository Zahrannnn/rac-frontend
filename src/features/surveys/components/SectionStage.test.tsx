import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { SECTIONS } from "../schema";
import { SectionStage } from "./SectionStage";

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

describe("SectionStage", () => {
  it("renders orgManagement likert with how-to-fill guidance", () => {
    const section = SECTIONS.find((candidate) => candidate.key === "orgManagement")!;

    renderWithI18n(
      <SectionStage
        section={section}
        answers={{}}
        onChange={vi.fn()}
        stepErrors={[]}
        howToFill="حدّد إجابة واحدة في كل صف"
      />
    );

    expect(screen.getByText("حدّد إجابة واحدة في كل صف")).toBeInTheDocument();
    expect(
      screen.getByText("تحتفظ إدارة الورشة بسجلات منتظمة لعمليات الصيانة والإصلاح.")
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(18);
  });
});
