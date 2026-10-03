import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nProvider } from "@/shared/i18n";
import { DistrictSelect, initDistrictChoice } from "./district-select";
import { OTHER_DISTRICT } from "@/shared/constants/districts";

// Radix Select relies on pointer-capture APIs jsdom does not implement.
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.scrollIntoView = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

function renderPicker(props: Partial<Parameters<typeof DistrictSelect>[0]> = {}) {
  const onPick = vi.fn();
  const utils = render(
    <I18nProvider>
      <DistrictSelect
        governorate="Cairo"
        value=""
        onPick={onPick}
        {...props}
      />
    </I18nProvider>
  );
  return { onPick, ...utils };
}

describe("initDistrictChoice", () => {
  it("pre-selects Other for legacy free-text values, preserving the text", () => {
    const choice = initDistrictChoice("Cairo", "Al-Manial Old District");
    expect(choice).toEqual({ other: true, manual: "Al-Manial Old District" });
  });

  it("keeps a listed district as a normal selection", () => {
    expect(initDistrictChoice("Cairo", "Maadi")).toEqual({ other: false, manual: "" });
    expect(initDistrictChoice("Cairo", "")).toEqual({ other: false, manual: "" });
    expect(initDistrictChoice("Cairo", null)).toEqual({ other: false, manual: "" });
  });
});

describe("DistrictSelect", () => {
  it("is disabled until a governorate is chosen", () => {
    renderPicker({ governorate: "" });
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("lists the governorate's districts and the Other escape hatch", async () => {
    renderPicker();
    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

    // Curated Cairo entries (Arabic labels — the default locale is ar)…
    expect(screen.getByRole("option", { name: "المعادي" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "مدينة نصر" })).toBeInTheDocument();
    // …with "Other (not listed)" last.
    expect(screen.getByRole("option", { name: "أخرى (غير مذكورة)" })).toBeInTheDocument();
  });

  it("picks a listed district", async () => {
    const { onPick } = renderPicker();
    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "المعادي" }));
    expect(onPick).toHaveBeenCalledWith("Maadi");
  });

  it("picks Other (not listed)", async () => {
    const { onPick } = renderPicker();
    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("option", { name: "أخرى (غير مذكورة)" }));
    expect(onPick).toHaveBeenCalledWith(OTHER_DISTRICT);
  });

  it("filters by English value or Arabic label while typing", async () => {
    renderPicker();
    fireEvent.click(screen.getByRole("combobox"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("ابحث عن حي…"), {
      target: { value: "Nasr" },
    });
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "مدينة نصر",
      "أخرى (غير مذكورة)",
    ]);
  });
});
