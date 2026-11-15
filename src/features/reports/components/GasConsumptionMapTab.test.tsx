import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/shared/i18n";
import type { GasConsumptionRow } from "../types";

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = () => {};
});

const { useGasConsumptionMock } = vi.hoisted(() => ({
  useGasConsumptionMock: vi.fn(),
}));

vi.mock("../hooks/use-reports", () => ({
  useGasConsumption: useGasConsumptionMock,
}));

// jsdom has no layout engine — stub the client-only leaflet child; the list,
// flags, states and the located-rows contract are what these tests pin.
vi.mock("./GasConsumptionMap", () => ({
  default: function FakeGasConsumptionMap({
    rows,
  }: {
    rows: Pick<GasConsumptionRow, "workshopId" | "latitude" | "longitude">[];
  }) {
    return (
      <div data-testid="map">
        {rows.map((row) => (
          <div
            key={row.workshopId}
            data-testid="map-marker"
            data-position={`${row.latitude},${row.longitude}`}
          />
        ))}
      </div>
    );
  },
}));

import { GasConsumptionMapTab } from "./GasConsumptionMapTab";

const gasWorkshop: GasConsumptionRow = {
  workshopId: "w-1",
  code: "MAC-CAR-000001",
  nameAr: "ورشة النصر",
  nameEn: "Nasr Workshop",
  governorate: "Cairo",
  latitude: 30.05,
  longitude: 31.23,
  annualTotalKg: 32.5,
  perGas: [
    { gas: "r134a", quantityKg: 25 },
    { gas: "other", quantityKg: 7.5 },
  ],
      sizeClass: null,
};

const heavyWorkshop: GasConsumptionRow = {
  workshopId: "w-2",
  code: "MAC-CAR-000002",
  nameAr: "ورشة التفوق",
  nameEn: "Excellence Workshop",
  governorate: "Asyut",
  latitude: 27.2,
  longitude: 31.25,
  annualTotalKg: 1500,
  perGas: [{ gas: "r134a", quantityKg: 1500 }],
      sizeClass: null,
};

const unlocatedWorkshop: GasConsumptionRow = {
  workshopId: "w-3",
  code: "MAC-CAR-000003",
  nameAr: "ورشة بلا موقع",
  nameEn: "Unlocated Workshop",
  governorate: null,
  latitude: null,
  longitude: null,
  annualTotalKg: 5,
  perGas: [{ gas: "r1234yf", quantityKg: 5 }],
      sizeClass: null,
};

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <GasConsumptionMapTab />
      </I18nProvider>
    </QueryClientProvider>
  );
}

describe("GasConsumptionMapTab (REGISTRY-GAS-SPEC §6/§7 item 11)", () => {
  it("renders pins only for located workshops and sorts the side list by annualTotalKg desc", async () => {
    useGasConsumptionMock.mockReturnValue({
      data: [unlocatedWorkshop, gasWorkshop, heavyWorkshop],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderTab();

    const markers = await screen.findAllByTestId("map-marker");
    expect(markers).toHaveLength(2); // the unlocated workshop gets NO pin
    expect(markers[0].getAttribute("data-position")).toBe("27.2,31.25"); // heaviest first in DOM order? located keeps row order
    expect(markers[1].getAttribute("data-position")).toBe("30.05,31.23");

    // Side list sorted by annualTotalKg desc: 1500 → 32.5 → 5.
    const list = screen.getByRole("list", {
      name: "الورش حسب الاستهلاك السنوي",
    });
    expect(list.textContent).toContain("ورشة التفوق");
    const items = Array.from(list.children);
    expect(items[0].textContent).toContain("1500");
    expect(items[1].textContent).toContain("32.5");
    expect(items[2].textContent).toContain("5");
  });

  it("flags no-coordinate workshops in the side list only", async () => {
    useGasConsumptionMock.mockReturnValue({
      data: [unlocatedWorkshop],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderTab();

    expect(screen.getByText("بدون إحداثيات")).toBeInTheDocument();
    // the unlocated workshop gets no pin — and the async map module has loaded
    await screen.findByTestId("map");
    expect(screen.queryAllByTestId("map-marker")).toHaveLength(0);
    // The total + unit render as adjacent nodes — assert on the list text content.
    const list = screen.getByRole("list", { name: "الورش حسب الاستهلاك السنوي" });
    expect(list.textContent).toContain("5");
    expect(list.textContent).toContain("كجم/سنة");
  });

  it("shows per-gas lines with the localized designation and the annual unit", () => {
    useGasConsumptionMock.mockReturnValue({
      data: [gasWorkshop],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderTab();

    const list = screen.getByRole("list", { name: "الورش حسب الاستهلاك السنوي" });
    // §11 corrections: per-gas rows are aligned designation/quantity pairs — assert the
    // row structure instead of the old "gas: kg" blob.
    const r134aRow = screen.getByText("R-134a").closest("li");
    expect(r134aRow?.textContent).toContain("25");
    const otherRow = screen.getByText("أخرى").closest("li");
    expect(otherRow?.textContent).toContain("7.5");
    expect(list.textContent).toContain("32.5 كجم/سنة");
  });

  it("shows the empty state when no workshop records gas", () => {
    useGasConsumptionMock.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderTab();

    expect(screen.getByText("لا توجد ورش ذات استهلاك غاز مسجَّل.")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("shows the error state with a retry action", () => {
    const refetch = vi.fn();
    useGasConsumptionMock.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    });
    renderTab();

    expect(screen.getByText("تعذر تحميل بيانات استهلاك الغاز.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /إعادة المحاولة/ }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
