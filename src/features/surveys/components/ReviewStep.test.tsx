import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { ReviewStep } from "./ReviewStep";

function renderReview(answers: Record<string, Record<string, unknown>>) {
  return render(
    <I18nProvider>
      <ReviewStep
        answers={answers}
        gpsRecorded
        consent="yes"
        onJumpToStep={vi.fn()}
      />
    </I18nProvider>
  );
}

describe("ReviewStep (closing signature thumbnails)", () => {
  it("renders captured signature images with their labels", () => {
    renderReview({
      closing: {
        surveyorSignature: "data:image/jpeg;base64,SIG1",
        ownerSignature: "data:image/jpeg;base64,SIG2",
      },
    });

    expect(screen.getByRole("img", { name: "توقيع الباحث" })).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,SIG1"
    );
    expect(screen.getByRole("img", { name: "توقيع صاحب الورشة (إن وافق)" })).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,SIG2"
    );
  });

  it("renders no signature strip when signatures are missing", () => {
    renderReview({ closing: {} });

    expect(screen.queryByRole("img", { name: "توقيع الباحث" })).not.toBeInTheDocument();
  });
});
