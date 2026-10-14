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

describe("ReviewStep (signature-free since customer decision 2026-10-14)", () => {
  it("renders the section walk list with the GPS row", () => {
    renderReview({});

    expect(screen.getByText("الموافقة على المشاركة")).toBeInTheDocument();
    expect(screen.getByText("الإغلاق والموافقات")).toBeInTheDocument();
    expect(screen.getByText("الموقع الجغرافي (إثبات الزيارة)")).toBeInTheDocument();
  });

  it("ignores legacy stored signature data URLs (no image strip, no crash)", () => {
    renderReview({
      closing: {
        photosConsent: "taken",
        surveyorSignature: "data:image/jpeg;base64,SIG1",
        ownerSignature: "data:image/jpeg;base64,SIG2",
      },
    });

    // the signature thumbnails were removed with the signature fields —
    // old surveys' answers are opaque JSON and simply stop rendering
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText("توقيع الباحث")).not.toBeInTheDocument();
    expect(screen.queryByText("توقيع صاحب الورشة (إن وافق)")).not.toBeInTheDocument();
  });
});
