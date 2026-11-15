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
import type { Technician } from "../types";
import type { TechnicianFormValues } from "../validations/technician-schema";

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

const validValues: TechnicianFormValues = {
  fullName: "احمد سمير",
  fullNameAr: "",
  nationalId: "30101010100114",
  mobile: "01012345678",
  workshopId: "w-1",
  specialty: "",
  yearsOfExperience: 5,
  notes: "",
  employmentType: "",
  employmentNature: "",
  hasModernRefrigerantExperience: "",
  address: "",
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
      { ...validValues, nationalId: "30101010100114", yearsOfExperience: "" },
      t,
      "edit"
    );
    expect(submission).toEqual({
      data: { ...validValues, nationalId: "30101010100114", yearsOfExperience: "" },
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
      nationalId: "30101010100114",
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
  /** A stored record whose registry fields are all populated (the edit-form prefill). */
  const original = {
    id: "t-1",
    gender: "male",
    age: 41,
    employmentType: "engineer",
    employmentNature: "permanent",
    hasModernRefrigerantExperience: false,
    address: "شبرا",
  } as unknown as Technician;

  it("sends role drafts as values and omits the immutable workshopId", () => {
    const values = {
      ...validValues,
      employmentType: "observer" as const,
      address: "الجيزة",
    };
    const payload = toTechnicianUpdatePayload(values, original);
    expect(payload.employmentType).toBe("observer");
    expect(payload.address).toBe("الجيزة");
    expect(payload).not.toHaveProperty("workshopId");
  });

  it("sends picked §11 drafts as values and the flag as its wire boolean", () => {
    const payload = toTechnicianUpdatePayload(
      { ...validValues, employmentNature: "selfEmployed", hasModernRefrigerantExperience: "yes" },
      original
    );
    expect(payload.employmentNature).toBe("selfEmployed");
    expect(payload.hasModernRefrigerantExperience).toBe(true);
    // An unpicked flag draft never travels — null = keep on the backend (no clear path).
    const untouched = toTechnicianUpdatePayload(validValues, original);
    expect(untouched.hasModernRefrigerantExperience).toBeUndefined();
    expect(JSON.stringify(untouched)).not.toContain("hasModernRefrigerantExperience");
  });

  it("sends a cleared registry draft as \"\" when a value was stored (= clear)", () => {
    const payload = toTechnicianUpdatePayload(validValues, original);
    expect(payload.employmentType).toBe("");
    expect(payload.address).toBe("");
  });

  it("omits a blank registry draft when nothing was stored (= keep, no clear marker)", () => {
    const payload = toTechnicianUpdatePayload(validValues);
    expect(payload.employmentType).toBeUndefined();
    expect(payload.address).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('"employmentType"');
    expect(JSON.stringify(payload)).not.toContain('"address"');
  });

  it("never sends gender or age — they derive from the national ID (§10B)", () => {
    const payload = toTechnicianUpdatePayload(validValues, original);
    expect(payload).not.toHaveProperty("gender");
    expect(payload).not.toHaveProperty("age");
    expect(JSON.stringify(payload)).not.toContain("gender");
    expect(JSON.stringify(payload)).not.toContain('"age"');
  });

  it("sends the editable national id, blanks as null", () => {
    const payload = toTechnicianUpdatePayload(validValues);
    expect(payload.fullName).toBe("احمد سمير");
    expect(payload.fullNameAr).toBeNull();
    expect(payload.nationalId).toBe("30101010100114");
    expect(payload.mobile).toBe("01012345678");
    expect(payload.specialty).toBeNull();
    expect(payload.yearsOfExperience).toBe(5);
    expect(payload.notes).toBeNull();
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
      employmentType: "",
      employmentNature: "",
      hasModernRefrigerantExperience: "",
      address: "",
    });
  });

  it("seeds an empty workshop for create mode without a locked workshop", () => {
    expect(toFormValues(null).workshopId).toBe("");
  });

  it("maps the stored §11 flag onto the yes/no draft", () => {
    const stored = { id: "t-9" } as unknown as Technician;
    expect(
      toFormValues({ ...stored, hasModernRefrigerantExperience: true }).hasModernRefrigerantExperience
    ).toBe("yes");
    expect(
      toFormValues({ ...stored, hasModernRefrigerantExperience: false }).hasModernRefrigerantExperience
    ).toBe("no");
    expect(toFormValues({ ...stored, hasModernRefrigerantExperience: null }).hasModernRefrigerantExperience)
      .toBe("");
    expect(toFormValues(null).hasModernRefrigerantExperience).toBe("");
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

describe("registry attribute fields (REGISTRY-GAS-SPEC §1/§10A)", () => {
  it("create payload carries role values and omits unset drafts", () => {
    const payload = toTechnicianCreatePayload({
      ...validValues,
      employmentType: "engineer" as const,
      address: "",
    });
    expect(payload.employmentType).toBe("engineer");
    expect(payload.address).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain('"address"');
    // Gender and age never travel (§10B — derived from the national ID).
    expect(payload).not.toHaveProperty("gender");
    expect(payload).not.toHaveProperty("age");
  });

  it("update payload: set drafts win, blank drafts over nothing stored stay omitted", () => {
    const payload = toTechnicianUpdatePayload({
      ...validValues,
      employmentType: "engineer" as const,
      address: "أسيوط",
    });
    expect(payload.employmentType).toBe("engineer");
    expect(payload.address).toBe("أسيوط");

    const cleared = toTechnicianUpdatePayload({
      ...validValues,
      employmentType: "",
      address: "",
    });
    expect(cleared.employmentType).toBeUndefined();
    expect(cleared.address).toBeUndefined();
    expect(JSON.stringify(cleared)).not.toContain('"employmentType"');
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
