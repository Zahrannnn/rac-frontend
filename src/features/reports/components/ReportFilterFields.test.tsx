import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import { REPORT_SUPPORTED_FILTERS } from "../types";
import type { ReportFilters } from "../types";
import { ReportFilterFields } from "./ReportFilterFields";

function renderWithProviders(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>{node}</I18nProvider>
    </QueryClientProvider>
  );
}

function renderFields(supported: readonly string[], filters: ReportFilters = {}) {
  const onFilterChange = vi.fn();
  const onGasBandChange = vi.fn();
  renderWithProviders(
    <ReportFilterFields
      supported={supported}
      filters={filters}
      onFilterChange={onFilterChange}
      onGasBandChange={onGasBandChange}
    />
  );
  return { onFilterChange, onGasBandChange };
}

describe("ReportFilterFields — per-gas size bands (REGISTRY-GAS-SPEC §10C)", () => {
  beforeEach(() => {
    // jsdom has no layout; the radix select scrolls the active option into view.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders the per-gas band block for workshop_registry", () => {
    renderFields(REPORT_SUPPORTED_FILTERS["workshop_registry"]!);

    expect(screen.getByText("تصفية حسب استهلاك الغاز")).toBeInTheDocument();
    // One dropdown per MAC gas (all three carry quantities).
    expect(screen.getByText("R-134a")).toBeInTheDocument();
    expect(screen.getByText("R-1234yf")).toBeInTheDocument();
    expect(screen.getByText("أخرى")).toBeInTheDocument();
  });

  it("omits the band block for reports that do not support it", () => {
    renderFields(REPORT_SUPPORTED_FILTERS["technician_registry"]!);
    expect(screen.queryByText("تصفية حسب استهلاك الغاز")).not.toBeInTheDocument();
  });

  it("offers the three verbatim survey size bands per gas", async () => {
    renderFields(["gasBand"]);

    const triggers = screen.getAllByRole("combobox");
    fireEvent.keyDown(triggers[0], { key: "ArrowDown" });

    expect(await screen.findByRole("option", { name: /أقل من 680/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /680 - 1360/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /أكثر من 1360/ })).toBeInTheDocument();
  });

  it("passes a picked band through to onGasBandChange", async () => {
    const { onGasBandChange } = renderFields(["gasBand"]);

    const triggers = screen.getAllByRole("combobox");
    fireEvent.keyDown(triggers[0], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: /أقل من 680/ }), {
      key: "Enter",
    });

    expect(onGasBandChange).toHaveBeenCalledWith("r134a", "small_lt680");
  });

  it("clears a gas pick back to \"\" via the all option", async () => {
    const { onGasBandChange } = renderFields(["gasBand"], {
      gasBand: { r134a: "small_lt680" },
    });

    const triggers = screen.getAllByRole("combobox");
    fireEvent.keyDown(triggers[0], { key: "ArrowDown" });
    fireEvent.keyDown(await screen.findByRole("option", { name: "الكل" }), {
      key: "Enter",
    });

    expect(onGasBandChange).toHaveBeenCalledWith("r134a", "");
  });
});

describe("REPORT_SUPPORTED_FILTERS pins (§7 item 12)", () => {
  it("workshop_registry supports the per-gas band filter", () => {
    const supported = REPORT_SUPPORTED_FILTERS["workshop_registry"]!;
    expect(supported).toContain("gasBand");
    expect(supported).not.toContain("gasType");
    expect(supported).not.toContain("minGasQuantity");
  });

  it("technician_training_profile is present with its five backend filters (drift fix)", () => {
    const supported = REPORT_SUPPORTED_FILTERS["technician_training_profile"];
    expect(supported).toEqual(["governorate", "workshopId", "status", "dateFrom", "dateTo"]);
  });
});
