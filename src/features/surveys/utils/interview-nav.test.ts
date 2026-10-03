import { describe, expect, it } from "vitest";
import { CONSENT_SECTION, SECTIONS, WIZARD_STEPS } from "../schema";
import {
  isComplexField,
  isSectionMode,
  isSimpleField,
  walkableFields,
  firstInvalidWalkableIndex,
  backTarget,
} from "./interview-nav";
import { isFieldValid } from "./answers";

describe("interview-nav", () => {
  it("treats consent enum as simple / field-walk", () => {
    expect(isSimpleField(CONSENT_SECTION.fields[0])).toBe(true);
    expect(isSectionMode(CONSENT_SECTION)).toBe(false);
    expect(walkableFields(CONSENT_SECTION)).toHaveLength(1);
  });

  it("walks basicInfo field-by-field including photo", () => {
    const basic = SECTIONS.find((s) => s.key === "basicInfo")!;
    expect(isSectionMode(basic)).toBe(false);
    expect(walkableFields(basic).some((f) => f.type === "photo")).toBe(true);
    // code + name + owner are context-prefilled — skipped in the walk
    expect(walkableFields(basic).some((f) => f.key === "projectCode")).toBe(false);
    expect(walkableFields(basic).some((f) => f.key === "workshopName")).toBe(false);
    expect(walkableFields(basic).some((f) => f.key === "ownerOrManagerName")).toBe(false);
    expect(walkableFields(basic).length).toBe(basic.fields.length - 3);
  });

  it("uses section mode for likert-only axes", () => {
    const axis = WIZARD_STEPS.find((s) => s.key === "orgManagement")!;
    expect(isSectionMode(axis)).toBe(true);
    expect(walkableFields(axis)).toEqual([]);
  });

  it("classifies likert as complex and enum as simple", () => {
    const axis = WIZARD_STEPS.find((s) => s.key === "orgManagement")!;
    expect(isComplexField(axis.fields[0])).toBe(true);
    expect(isSimpleField(axis.fields[0])).toBe(false);
  });

  it("lands Incomplete jump on the first invalid required walkable field", () => {
    const basic = SECTIONS.find((s) => s.key === "basicInfo")!;
    // identity fields skipped; governorate is first walkable required field
    const index = firstInvalidWalkableIndex(basic, {}, isFieldValid);
    expect(walkableFields(basic)[index].key).toBe("governorate");
  });
});

describe("backTarget (wizard Back navigation)", () => {
  const reviewStep = WIZARD_STEPS.length;

  it("re-enters the last questionnaire step (at its first field) from review", () => {
    expect(backTarget(reviewStep, 0)).toEqual({ step: reviewStep - 1, fieldIndex: 0 });
  });

  it("walks fields backwards inside a field-walk section", () => {
    expect(backTarget(1, 2)).toEqual({ step: 1, fieldIndex: 1 }); // basicInfo, third question
  });

  it("crossing into basicInfo lands on the last field of consent (walkable)", () => {
    expect(backTarget(1, 0)).toEqual({ step: 0, fieldIndex: 0 }); // consent walks 1 field
  });

  it("crossing into a section-mode step lands on the last field of the previous walk", () => {
    // orgManagement (step 2) is section-mode; basicInfo walks 11 fields
    const basic = SECTIONS.find((s) => s.key === "basicInfo")!;
    expect(backTarget(2, 0)).toEqual({
      step: 1,
      fieldIndex: walkableFields(basic).length - 1,
    });
  });

  it("is null on the very first question (consent)", () => {
    expect(backTarget(0, 0)).toBeNull();
  });
});
