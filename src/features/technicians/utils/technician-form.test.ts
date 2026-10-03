import { describe, expect, it } from "vitest";
import {
  isCustomSpecialty,
  parseTechnicianSubmission,
  specialtyFromSelectValue,
  specialtySelectValue,
  toFormValues,
  toTechnicianCreatePayload,
  toTechnicianUpdatePayload,
} from "./technician-form";
import {
  SPECIALIZATION_OPTIONS,
  SPECIALTY_OTHER_DEFAULT,
  SPECIALTY_OTHER_SENTINEL,
} from "../constants/specializations";
import { ar } from "@/shared/i18n";

/** Real dictionary lookup — exercises the actual Arabic messages. */
const t = ((key: string, params?: Record<string, string | number>) => {
  let text = (ar as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
  // minimal cast so the tests compile against the useT-derived TFunc type
}) as unknown as Parameters<typeof parseTechnicianSubmission>[1];

const validValues = {
  fullName: "احمد سمير",
  fullNameAr: "",
  nationalId: "30001011234567",
  mobile: "01012345678",
  workshopId: "w-1",
  specialty: "",
  yearsOfExperience: 5,
  notes: "",
};

describe("parseTechnicianSubmission", () => {
  it("returns trimmed data for a valid submission", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, fullName: "  احمد سمير  " },
      t,
      "create"
    );
    expect(submission).toEqual({ data: validValues });
  });

  it("maps each invalid field to its Arabic message (first issue wins)", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, fullName: "", nationalId: "123", mobile: "01312345678", workshopId: "" },
      t,
      "create"
    );
    expect("errors" in submission && submission.errors).toEqual({
      fullName: ar["technicians.fullNameRequired"],
      nationalId: ar["technicians.nationalIdInvalid"],
      mobile: ar["wizard.mobileInvalid"],
      workshopId: ar["technicians.workshopRequired"],
    });
  });

  it("edit mode tolerates a legacy nationalId and a cleared years draft", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, nationalId: "legacy-import", yearsOfExperience: "" },
      t,
      "edit"
    );
    expect(submission).toEqual({
      data: { ...validValues, nationalId: "legacy-import", yearsOfExperience: "" },
    });
  });

  it("create mode still rejects a cleared years draft", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, yearsOfExperience: "" },
      t,
      "create"
    );
    expect("errors" in submission && submission.errors.yearsOfExperience).toBe(
      ar["technicians.yearsInvalid"]
    );
  });
});

describe("toTechnicianCreatePayload", () => {
  it("omits blank optionals from the POST body", () => {
    expect(toTechnicianCreatePayload(validValues)).toEqual({
      fullName: "احمد سمير",
      fullNameAr: undefined,
      nationalId: "30001011234567",
      mobile: "01012345678",
      workshopId: "w-1",
      specialty: undefined,
      yearsOfExperience: 5,
      notes: undefined,
    });
  });
});

describe("toTechnicianUpdatePayload", () => {
  it("sends blanks as null and omits the immutable nationalId/workshopId", () => {
    const payload = toTechnicianUpdatePayload(validValues);
    expect(payload).toEqual({
      fullName: "احمد سمير",
      fullNameAr: null,
      mobile: "01012345678",
      specialty: null,
      yearsOfExperience: 5,
      notes: null,
    });
    expect(payload).not.toHaveProperty("nationalId");
    expect(payload).not.toHaveProperty("workshopId");
  });

  it("omits a cleared years draft so the stored value is left unchanged", () => {
    const payload = toTechnicianUpdatePayload({ ...validValues, yearsOfExperience: "" });
    expect(payload).not.toHaveProperty("yearsOfExperience");
  });
});

describe("toFormValues", () => {
  it("seeds blank values for create mode, honoring a locked workshop", () => {
    expect(toFormValues(null, "w-9")).toEqual({
      fullName: "",
      fullNameAr: "",
      nationalId: "",
      mobile: "",
      workshopId: "w-9",
      specialty: "",
      yearsOfExperience: 0,
      notes: "",
    });
  });
});

describe("specialty select helpers", () => {
  it("maps listed, custom, and blank specialties onto select values", () => {
    expect(specialtySelectValue(SPECIALIZATION_OPTIONS[0])).toBe(SPECIALIZATION_OPTIONS[0]);
    expect(specialtySelectValue("فني مكيفات يخ")).toBe(SPECIALTY_OTHER_SENTINEL);
    expect(specialtySelectValue(undefined)).toBe("");
  });

  it("resolves the Other sentinel to the free-text default", () => {
    expect(specialtyFromSelectValue(SPECIALTY_OTHER_SENTINEL)).toBe(SPECIALTY_OTHER_DEFAULT);
    expect(specialtyFromSelectValue(SPECIALIZATION_OPTIONS[0])).toBe(SPECIALIZATION_OPTIONS[0]);
  });

  it("treats any unlisted non-blank value as custom", () => {
    expect(isCustomSpecialty("فني مكيفات يخ")).toBe(true);
    expect(isCustomSpecialty(SPECIALIZATION_OPTIONS[0])).toBe(false);
    expect(isCustomSpecialty("")).toBe(false);
    expect(isCustomSpecialty(null)).toBe(false);
  });
});
