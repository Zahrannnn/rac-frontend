import { describe, expect, it } from "vitest";
import { GOVERNORATES } from "./egypt";
import {
  DISTRICTS,
  DISTRICT_AR,
  districtLabel,
  districtsFor,
  isListedDistrict,
  OTHER_DISTRICT,
} from "./districts";

describe("districts reference data", () => {
  it("covers every governorate with at least one district", () => {
    for (const governorate of GOVERNORATES) {
      expect(DISTRICTS[governorate].length, governorate).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps every value within the backend's 64-char limit, trimmed", () => {
    for (const districts of Object.values(DISTRICTS)) {
      for (const district of districts) {
        expect(district.length, district).toBeLessThanOrEqual(64);
        expect(district.trim(), district).toBe(district);
      }
    }
  });

  it("mirrors every entry with a non-empty Arabic label in the same order", () => {
    for (const governorate of GOVERNORATES) {
      const english = DISTRICTS[governorate];
      const arabic = DISTRICT_AR[governorate];
      expect(arabic.length, governorate).toBe(english.length);
      english.forEach((district, index) => {
        expect(arabic[index].trim().length, `${governorate}/${district}`).toBeGreaterThan(0);
      });
    }
  });

  it("has no duplicate districts within a governorate", () => {
    for (const [governorate, districts] of Object.entries(DISTRICTS)) {
      expect(new Set(districts).size, governorate).toBe(districts.length);
    }
  });

  it("never lists the Other sentinel as a district value", () => {
    for (const districts of Object.values(DISTRICTS)) {
      expect(districts).not.toContain(OTHER_DISTRICT);
    }
  });

  it("labels resolve per locale and fall back to the raw value", () => {
    expect(districtLabel("Cairo", "Maadi", "ar")).toBe("المعادي");
    expect(districtLabel("Cairo", "Maadi", "en")).toBe("Maadi");
    expect(districtLabel("Cairo", "Legacy Free Text", "ar")).toBe("Legacy Free Text");
    expect(districtsFor("Atlantis")).toEqual([]);
    expect(isListedDistrict("Cairo", "Maadi")).toBe(true);
    expect(isListedDistrict("Cairo", "Nowhere")).toBe(false);
  });
});
