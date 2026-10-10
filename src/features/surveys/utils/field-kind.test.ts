import { describe, expect, it } from "vitest";
import { CONSENT_SECTION, SECTIONS, WIZARD_STEPS } from "../schema";
import { isComplexField, isSimpleField } from "./field-kind";

describe("field-kind (section-page classification)", () => {
  it("treats the consent enum as simple (inline card)", () => {
    expect(isSimpleField(CONSENT_SECTION.fields[0])).toBe(true);
    expect(isComplexField(CONSENT_SECTION.fields[0])).toBe(false);
  });

  it("classifies likert/matrices/checklist/signature as complex (full-width blocks)", () => {
    const axis = WIZARD_STEPS.find((s) => s.key === "orgManagement")!;
    expect(isComplexField(axis.fields[0])).toBe(true);
    expect(isSimpleField(axis.fields[0])).toBe(false);

    const workforce = SECTIONS.find((s) => s.key === "workforce")!;
    const complexKeys = workforce.fields.filter(isComplexField).map((f) => f.key);
    expect(complexKeys).toEqual(
      expect.arrayContaining(["workforce", "carsPerMonth", "refrigerants"])
    );
  });

  it("classifies text-ish inputs and photos outside the complex set", () => {
    const basic = SECTIONS.find((s) => s.key === "basicInfo")!;
    expect(isSimpleField(basic.fields.find((f) => f.key === "workshopName")!)).toBe(true);
    const photo = basic.fields.find((f) => f.key === "frontPhoto")!;
    expect(isSimpleField(photo)).toBe(false);
    expect(isComplexField(photo)).toBe(false); // photos render via the uploader branch
  });
});
