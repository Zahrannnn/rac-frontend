import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { InterviewShell } from "./InterviewShell";

describe("InterviewShell", () => {
  it("renders workshop code, progress, stage, and footer actions", () => {
    render(
      <I18nProvider>
        <InterviewShell
          workshopCode="RAC-CAR-000009"
          status="Draft"
          title="بيانات الورشة"
          progressLabel="السؤال 1 من 14"
          progressPercent={25}
          footerStart={<button type="button">Back</button>}
          footerEnd={<button type="button">Next</button>}
        >
          <p>Stage body</p>
        </InterviewShell>
      </I18nProvider>
    );

    expect(screen.getByText("RAC-CAR-000009")).toBeInTheDocument();
    expect(screen.getByText("بيانات الورشة")).toBeInTheDocument();
    expect(screen.getByText("السؤال 1 من 14")).toBeInTheDocument();
    expect(screen.getByText("Stage body")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });
});
