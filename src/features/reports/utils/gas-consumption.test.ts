import { describe, expect, it } from "vitest";
import {
  GAS_CONSUMPTION_BANDS,
  GAS_BAND_COUNT,
  formatGasKg,
  gasBandColor,
  gasBandIndex,
  gasDesignation,
  gasPinSvg,
  gasRowName,
} from "./gas-consumption";
import { ar } from "@/shared/i18n";
import type { GasConsumptionRow } from "../types";

const t = ((key: string) => (ar as Record<string, string>)[key] ?? key) as Parameters<
  typeof gasDesignation
>[1];

const row: GasConsumptionRow = {
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
    { gas: "r1234yf", quantityKg: 7.5 },
  ],
      sizeClass: null,
};

describe("gas consumption bands (REGISTRY-GAS-SPEC §6, §7 item 11)", () => {
  it("uses the six established thresholds", () => {
    expect(GAS_BAND_COUNT).toBe(6);
    expect(GAS_CONSUMPTION_BANDS.map((band) => band.label)).toEqual([
      ">1000",
      "501–1000",
      "251–500",
      "101–250",
      "51–100",
      "1–50",
    ]);
  });

  it("places boundary totals in exactly one band", () => {
    expect(gasBandIndex(1000.5)).toBe(0); // >1000
    expect(gasBandIndex(1000)).toBe(1); // 501–1000
    expect(gasBandIndex(501)).toBe(1);
    expect(gasBandIndex(500)).toBe(2); // 251–500
    expect(gasBandIndex(250)).toBe(3); // 101–250
    expect(gasBandIndex(100)).toBe(4); // 51–100
    expect(gasBandIndex(50)).toBe(5); // 1–50
    expect(gasBandIndex(0.5)).toBe(5);
  });

  it("darkens and enlarges pins toward the heavier bands", () => {
    expect(gasBandColor(0)).not.toBe(gasBandColor(5));
    const heavy = gasPinSvg(0);
    const light = gasPinSvg(5);
    expect(heavy.size[1]).toBeGreaterThan(light.size[1]);
  });
});

describe("gas cell rendering helpers", () => {
  it("localizes the other key and passes the designations through", () => {
    expect(gasDesignation("r134a", t)).toBe("R-134a");
    expect(gasDesignation("r1234yf", t)).toBe("R-1234yf");
    expect(gasDesignation("other", t)).toBe("أخرى");
  });

  it("formats as-saved kg without spurious decimals", () => {
    expect(formatGasKg(25)).toBe("25");
    expect(formatGasKg(7.5)).toBe("7.5");
    expect(formatGasKg(32.5)).toBe("32.5");
  });

  it("picks the localized row name per locale", () => {
    expect(gasRowName(row, "ar")).toBe("ورشة النصر");
    expect(gasRowName(row, "en")).toBe("Nasr Workshop");
    const namelessAr = { ...row, nameAr: null };
    expect(gasRowName(namelessAr, "ar")).toBe("Nasr Workshop");
  });
});
