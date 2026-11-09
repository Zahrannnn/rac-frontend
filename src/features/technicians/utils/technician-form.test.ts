import { describe, expect, it } from "vitest";
import {
  isCustomSpecialty,
  parseTechnicianSubmission,
  specialtyFromSelectValue,
  specialtySelectValue,
  toFormValues,
  toTechnicianCreatePayload,
  toTechnicianUpdatePayload,
  workshopFromSelectValue,
  workshopSelectValue,
  WORKSHOP_NONE_SENTINEL,
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
      { ...validValues, fullName: "", nationalId: "123", mobile: "01312345678" },
      t,
      "create"
    );
    expect("errors" in submission && submission.errors).toEqual({
      fullName: ar["technicians.fullNameRequired"],
      nationalId: ar["technicians.nationalIdInvalid"],
      mobile: ar["wizard.mobileInvalid"],
    });
  });

  it("accepts an empty workshop (free technician) — no required error", () => {
    const submission = parseTechnicianSubmission({ ...validValues, workshopId: "" }, t, "create");
    expect(submission).toEqual({ data: { ...validValues, workshopId: "" } });
  });

  it("edit mode validates the national id (14-digit when present) and tolerates a cleared years draft", () => {
    const malformed = parseTechnicianSubmission(
      { ...validValues, nationalId: "legacy-import", yearsOfExperience: "" },
      t,
      "edit"
    );
    expect("errors" in malformed && malformed.errors).toEqual({
      nationalId: ar["technicians.nationalIdInvalid"],
    });

    // A valid edit passes through with the cleared years draft intact.
    const submission = parseTechnicianSubmission(
      { ...validValues, nationalId: "29801011234567", yearsOfExperience: "" },
      t,
      "edit"
    );
    expect(submission).toEqual({
      data: { ...validValues, nationalId: "29801011234567", yearsOfExperience: "" },
    });
  });

  it("edit mode accepts a blank nationalId draft (null = keep the stored value)", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, nationalId: "", yearsOfExperience: "" },
      t,
      "edit"
    );
    expect(submission).toEqual({
      data: { ...validValues, nationalId: "", yearsOfExperience: "" },
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

  it("accepts blank nationalId and mobile (both optional) in create mode", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, nationalId: "", mobile: "" },
      t,
      "create"
    );
    expect(submission).toEqual({
      data: { ...validValues, nationalId: "", mobile: "" },
    });
  });

  it("still rejects a malformed non-blank nationalId or mobile", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, nationalId: "123", mobile: "01312345678" },
      t,
      "create"
    );
    expect("errors" in submission && submission.errors).toEqual({
      nationalId: ar["technicians.nationalIdInvalid"],
      mobile: ar["wizard.mobileInvalid"],
    });
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

  it("sends blank nationalId/mobile as undefined (dropped at serialization)", () => {
    const payload = toTechnicianCreatePayload({ ...validValues, nationalId: "", mobile: "" });
    expect(payload.nationalId).toBeUndefined();
    expect(payload.mobile).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("nationalId");
    expect(JSON.stringify(payload)).not.toContain("mobile");
  });

  it("maps an empty workshop draft to a null workshopId (free technician)", () => {
    const payload = toTechnicianCreatePayload({ ...validValues, workshopId: "" });
    expect(payload.workshopId).toBeNull();
  });
});

describe("toTechnicianUpdatePayload", () => {
  it("sends the editable national id, blanks as null, and omits the immutable workshopId", () => {
    const payload = toTechnicianUpdatePayload(validValues);
    expect(payload).toEqual({
      fullName: "احمد سمير",
      fullNameAr: null,
      nationalId: "30001011234567",
      mobile: "01012345678",
      specialty: null,
      yearsOfExperience: 5,
      notes: null,
    });
    expect(payload).not.toHaveProperty("workshopId");
  });

  it("sends a cleared nationalId draft as null (= keep the stored value)", () => {
    const payload = toTechnicianUpdatePayload({ ...validValues, nationalId: "" });
    expect(payload.nationalId).toBeNull();
    expect(JSON.stringify(payload)).not.toContain('"nationalId":""');
  });

  it("omits a cleared years draft so the stored value is left unchanged", () => {
    const payload = toTechnicianUpdatePayload({ ...validValues, yearsOfExperience: "" });
    expect(payload).not.toHaveProperty("yearsOfExperience");
  });

  it("sends a cleared mobile as null (nullable column), never an empty string", () => {
    const payload = toTechnicianUpdatePayload({ ...validValues, mobile: "" });
    expect(payload.mobile).toBeNull();
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

  it("seeds an empty workshop for create mode without a locked workshop", () => {
    expect(toFormValues(null).workshopId).toBe("");
  });
});

describe("qualification dropdown options", () => {
  it("offers exactly the three qualification options", () => {
    expect([...SPECIALIZATION_OPTIONS]).toEqual(["مؤهل عالي", "مؤهل متوسط", "بدون"]);
  });

  it("stores the option text, and the Other sentinel resolves to the free-text default", () => {
    expect(specialtyFromSelectValue(SPECIALIZATION_OPTIONS[0])).toBe("مؤهل عالي");
    expect(specialtyFromSelectValue(SPECIALIZATION_OPTIONS[1])).toBe("مؤهل متوسط");
    expect(specialtyFromSelectValue(SPECIALIZATION_OPTIONS[2])).toBe("بدون");
    expect(specialtyFromSelectValue(SPECIALTY_OTHER_SENTINEL)).toBe(SPECIALTY_OTHER_DEFAULT);
  });

  it("legacy stored role names fall to the Other sentinel as free text", () => {
    expect(specialtySelectValue("فني تبريد وتكييف")).toBe(SPECIALTY_OTHER_SENTINEL);
    expect(isCustomSpecialty("فني تبريد وتكييف")).toBe(true);
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

describe("workshop select helpers", () => {
  it("maps an empty workshop draft onto the بدون ورشة sentinel and back", () => {
    expect(workshopSelectValue("")).toBe(WORKSHOP_NONE_SENTINEL);
    expect(workshopFromSelectValue(WORKSHOP_NONE_SENTINEL)).toBe("");
  });

  it("passes a picked workshop through unchanged", () => {
    expect(workshopSelectValue("w-1")).toBe("w-1");
    expect(workshopFromSelectValue("w-1")).toBe("w-1");
  });
});
