import { describe, expect, it } from "vitest";
import { PILOT_GOVERNORATE_OPTIONS, SEASONAL_COLS, SUPPLY_DIFFICULTY_OPTIONS } from "./schema/constants";
import { SECTIONS } from "./schema/sections";

/** Questionnaire Ver3 contract pins — the stored answers and the backend
 * rubric keys depend on these exact option/band keys (schema.ts is a 1:1
 * transcription of "UNIDO_MAC_Field_Questionnaire_Final_AR Ver3"). */
describe("schema contract (questionnaire Ver3)", () => {
  it("offers exactly the three pilot governorates", () => {
    const basicInfo = SECTIONS.find((section) => section.key === "basicInfo")!;
    const governorate = basicInfo.fields.find((field) => field.key === "governorate")!;
    expect(governorate.options).toEqual(["cairo", "giza", "qalyubia"]);
    expect(PILOT_GOVERNORATE_OPTIONS).toEqual(["cairo", "giza", "qalyubia"]);
  });

  it("carries exactly the five Ver3 seasonal volume bands", () => {
    expect([...SEASONAL_COLS]).toEqual(["lt20", "20_49", "50_99", "100_200", "gt200"]);
    const carsPerMonth = SECTIONS.find((section) => section.key === "workforce")!.fields.find(
      (field) => field.key === "carsPerMonth"
    )!;
    expect(carsPerMonth.type).toBe("matrix2x5");
  });

  it("makes the three annual gas tables optional and the only deselectable fields", () => {
    const workforce = SECTIONS.find((section) => section.key === "workforce")!;
    const gasKeys = ["annualGasKg", "annualLeakageKg", "expectedRecoveryKg"];
    for (const key of gasKeys) {
      const field = workforce.fields.find((field) => field.key === key)!;
      expect(field.required).toBe(false);
      expect(field.deselectable).toBe(true);
    }
    // 2026-11 scope: no other workforce field (and no other section) deselects.
    const others = workforce.fields.filter((field) => !gasKeys.includes(field.key));
    expect(others.every((field) => !field.deselectable)).toBe(true);
    expect(
      SECTIONS.every((section) =>
        section.fields.every(
          (field) => !field.deselectable || section.key === "workforce"
        )
      )
    ).toBe(true);
  });

  it("narrows supply difficulty to the paper's single لا/نعم mark", () => {
    expect([...SUPPLY_DIFFICULTY_OPTIONS]).toEqual(["no", "yes"]);
  });

  it("drops the third state from mixedGasDetected (نعم/لا only)", () => {
    const mixedGas = SECTIONS.find((section) => section.key === "workforce")!.fields.find(
      (field) => field.key === "mixedGasDetected"
    )!;
    expect(mixedGas.options).toEqual(["yes", "no"]);
  });

  it("keeps the 3col gas-range bands of the questionnaire table", () => {
    const annualGasKg = SECTIONS.find((section) => section.key === "workforce")!.fields.find(
      (field) => field.key === "annualGasKg"
    )!;
    expect(annualGasKg.options).toEqual(["R-134a", "R-1234yf", "other"]);
  });

  it("closing section carries only photosConsent + date (signatures removed, customer decision 2026-10-14)", () => {
    const closing = SECTIONS.find((section) => section.key === "closing")!;
    expect(closing.fields.map((field) => field.key)).toEqual(["photosConsent", "date"]);
    const signatureKeys = SECTIONS
      .flatMap((section) => section.fields.map((field) => field.key))
      .filter((key) => key.toLowerCase().includes("signature"));
    expect(signatureKeys).toEqual([]);
  });
});
