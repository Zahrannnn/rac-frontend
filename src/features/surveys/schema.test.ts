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
});
