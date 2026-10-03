import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { ValidationPanel } from "./ValidationPanel";

function renderPanel(validation: Parameters<typeof ValidationPanel>[0]["validation"]) {
  const onJump = vi.fn();
  render(
    <I18nProvider>
      <ValidationPanel validation={validation} onJumpToStep={onJump} />
    </I18nProvider>
  );
  return onJump;
}

describe("ValidationPanel (Incomplete submit result)", () => {
  it("lists only failing rules with their backend detail", () => {
    renderPanel([
      { ruleKey: "gpsRequired", sectionKey: null, passed: false, detail: "GPS coordinates were not recorded." },
      { ruleKey: "minPhotos", sectionKey: "basicInfo", passed: false, detail: "basicInfo requires at least 1 photo(s)." },
      { ruleKey: "consent", sectionKey: "consent", passed: true, detail: "Participation consent given." },
    ]);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("إثبات الموقع الجغرافي مفقود")).toBeInTheDocument();
    expect(screen.getByText("الحد الأدنى للصور غير مستوفى")).toBeInTheDocument();
    // passed entries are not listed
    expect(screen.queryByText("الموافقة على المشاركة")).not.toBeInTheDocument();
  });

  it("deep-links a failing rule to its section step", () => {
    const onJump = renderPanel([
      { ruleKey: "minPhotos", sectionKey: "basicInfo", passed: false, detail: "needs photo" },
    ]);

    fireEvent.click(screen.getByRole("button", { name: "الانتقال إلى: البيانات الأساسية للورشة" }));
    expect(onJump).toHaveBeenCalledWith(1); // basicInfo is step index 1
  });

  it("renders nothing when every rule passed", () => {
    const onJump = renderPanel([
      { ruleKey: "gpsRequired", sectionKey: null, passed: true, detail: "ok" },
    ]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onJump).not.toHaveBeenCalled();
  });
});
