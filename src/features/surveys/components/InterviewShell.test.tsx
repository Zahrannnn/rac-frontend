import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import type { TocSection } from "./InterviewShell";
import { InterviewShell } from "./InterviewShell";

const tocSections: TocSection[] = [
  { key: "consent", label: "الموافقة على المشاركة", state: "complete", answered: 1, total: 1, current: false },
  { key: "basicInfo", label: "البيانات الأساسية للورشة", state: "partial", answered: 3, total: 13, current: true },
  { key: "orgManagement", label: "المحور الأول — التنظيم والإدارة والتوثيق", state: "empty", answered: 0, total: 1, current: false },
];

describe("InterviewShell", () => {
  it("renders workshop code, progress, stage, and footer actions", () => {
    render(
      <I18nProvider>
        <InterviewShell
          workshopCode="RAC-CAR-000009"
          status="Draft"
          title="بيانات الورشة"
          progressLabel="القسم 2 من 13"
          progressPercent={25}
          sections={tocSections}
          onNavigateToSection={vi.fn()}
          footerStart={<button type="button">Back</button>}
          footerEnd={<button type="button">Next</button>}
        >
          <p>Stage body</p>
        </InterviewShell>
      </I18nProvider>
    );

    expect(screen.getByText("RAC-CAR-000009")).toBeInTheDocument();
    expect(screen.getByText("بيانات الورشة")).toBeInTheDocument();
    expect(screen.getByText("القسم 2 من 13")).toBeInTheDocument();
    expect(screen.getByText("Stage body")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("opens the TOC drawer listing every section with its completion state", () => {
    render(
      <I18nProvider>
        <InterviewShell
          workshopCode="RAC-CAR-000009"
          status="Draft"
          title="بيانات الورشة"
          progressLabel="القسم 2 من 13"
          progressPercent={25}
          sections={tocSections}
          onNavigateToSection={vi.fn()}
        >
          <p>Stage body</p>
        </InterviewShell>
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "قائمة الأقسام" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("أقسام الاستبيان");
    // complete: check icon + aria label
    expect(
      screen.getByRole("button", { name: "الموافقة على المشاركة — مكتمل" })
    ).toBeInTheDocument();
    // partial: visible n/m count
    expect(
      screen.getByRole("button", { name: "البيانات الأساسية للورشة — مُجاب 3 من 13" })
    ).toBeInTheDocument();
    expect(screen.getByText("3/13")).toBeInTheDocument();
    // empty section
    expect(
      screen.getByRole("button", {
        name: "المحور الأول — التنظيم والإدارة والتوثيق — لم يبدأ",
      })
    ).toBeInTheDocument();
    // current section highlighted
    expect(screen.getByRole("button", { name: /البيانات الأساسية للورشة/ })).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  it("navigates to the tapped section and closes the drawer", () => {
    const onNavigate = vi.fn();
    render(
      <I18nProvider>
        <InterviewShell
          workshopCode="RAC-CAR-000009"
          status="Draft"
          title="بيانات الورشة"
          progressLabel="القسم 2 من 13"
          progressPercent={25}
          sections={tocSections}
          onNavigateToSection={onNavigate}
        >
          <p>Stage body</p>
        </InterviewShell>
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "قائمة الأقسام" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "المحور الأول — التنظيم والإدارة والتوثيق — لم يبدأ",
      })
    );

    expect(onNavigate).toHaveBeenCalledWith(2);
  });
});
