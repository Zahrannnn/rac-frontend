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
  gender: "",
  age: "" as const,
  mobile: "01012345678",
  workshopId: "w-1",
  specialty: "",
  yearsOfExperience: 5,
  employmentType: "engineer",
  employmentNature: "",
  hasModernRefrigerantExperience: "",
  address: "القاهرة",
  notes: "",
} satisfies import("../validations/technician-schema").TechnicianFormValues;

/** Full Technician stub — registry keep/clear/set tests seed it per case. */
const technicianStub = {
  id: "t-1",
  fullName: "احمد سمير",
  fullNameAr: null,
  mobile: null,
  workshopId: null,
  workshopCode: null,
  specialty: null,
  yearsOfExperience: 5,
  status: "Active",
  notes: null,
  gender: null,
  age: null,
  employmentType: null,
  employmentNature: null,
  hasModernRefrigerantExperience: null,
  employer: null,
  address: null,
  createdAtUtc: "2026-01-01T00:00:00Z",
} satisfies import("../types").Technician;

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
      { ...validValues, fullName: "", mobile: "01012345678" },
      t,
      "create"
    );
    expect("errors" in submission && submission.errors).toEqual({
      fullName: ar["technicians.fullNameRequired"],
    });
  });

  it("accepts an empty workshop (free technician) — no required error", () => {
    const submission = parseTechnicianSubmission({ ...validValues, workshopId: "" }, t, "create");
    expect(submission).toEqual({ data: { ...validValues, workshopId: "" } });
  });

  it("edit mode tolerates a cleared years draft and the blank identity drafts", () => {
    const valid = parseTechnicianSubmission(
      { ...validValues, yearsOfExperience: "" },
      t,
      "edit"
    );
    expect(valid).toEqual({
      data: { ...validValues, yearsOfExperience: "" },
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

  it("2026-11-17 manual identity: blank gender/age stay legal; bad keys/bounds block saving", () => {
    // Both blanks legal (both optional).
    const blank = parseTechnicianSubmission(
      { ...validValues, gender: "", age: "" },
      t,
      "create"
    );
    expect(blank).toEqual({ data: { ...validValues } });

    // An unknown gender key → the Arabic gender message.
    const badGender = parseTechnicianSubmission(
      { ...validValues, gender: "other" as never },
      t,
      "create"
    );
    expect("errors" in badGender && badGender.errors.gender).toBe(
      ar["technicians.genderInvalid"]
    );

    // Age outside 10–90 → the Arabic age message.
    const badAge = parseTechnicianSubmission(
      { ...validValues, age: 91 },
      t,
      "create"
    );
    expect("errors" in badAge && badAge.errors.age).toBe(ar["technicians.ageInvalid"]);

    // A valid manual identity passes through.
    const good = parseTechnicianSubmission(
      { ...validValues, gender: "female", age: 28 },
      t,
      "create"
    );
    expect(good).toEqual({ data: { ...validValues, gender: "female", age: 28 } });
  });

  it("still rejects a malformed mobile", () => {
    const submission = parseTechnicianSubmission(
      { ...validValues, mobile: "01312345678" },
      t,
      "create"
    );
    expect("errors" in submission && submission.errors).toEqual({
      mobile: ar["wizard.mobileInvalid"],
    });
  });
});

describe("toTechnicianCreatePayload", () => {
  it("omits blank optionals from the POST body", () => {
    expect(toTechnicianCreatePayload(validValues)).toEqual({
      fullName: "احمد سمير",
      fullNameAr: undefined,
      gender: undefined,
      age: undefined,
      mobile: "01012345678",
      workshopId: "w-1",
      specialty: undefined,
      yearsOfExperience: 5,
      employmentType: "engineer",
      employmentNature: undefined,
      hasModernRefrigerantExperience: undefined,
      address: "القاهرة",
      notes: undefined,
    });
  });

  it("sends the manual identity drafts onto the wire (2026-11-17)", () => {
    const payload = toTechnicianCreatePayload({
      ...validValues,
      gender: "female",
      age: 28,
    });
    expect(payload.gender).toBe("female");
    expect(payload.age).toBe(28);
    // A blank age draft drops at serialization.
    expect(JSON.stringify(toTechnicianCreatePayload(validValues))).not.toContain('"age"');
  });

  it("maps an empty workshop draft to a null workshopId (free technician)", () => {
    const payload = toTechnicianCreatePayload({ ...validValues, workshopId: "" });
    expect(payload.workshopId).toBeNull();
  });

  it("omits blank registry drafts from the POST body (REGISTRY-GAS-SPEC §2)", () => {
    const payload = toTechnicianCreatePayload({
      ...validValues,
      employmentType: "",
      employmentNature: "",
      hasModernRefrigerantExperience: "",
      address: "",
    });
    expect(payload.employmentType).toBeUndefined();
    expect(payload.employmentNature).toBeUndefined();
    expect(payload.hasModernRefrigerantExperience).toBeUndefined();
    expect(payload.address).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("employmentType");
  });

  it("maps the §11 yes/no drafts onto the wire booleans (REGISTRY-GAS-SPEC §11)", () => {
    expect(
      toTechnicianCreatePayload({
        ...validValues,
        hasModernRefrigerantExperience: "yes",
      }).hasModernRefrigerantExperience
    ).toBe(true);
    expect(
      toTechnicianCreatePayload({
        ...validValues,
        hasModernRefrigerantExperience: "no",
      }).hasModernRefrigerantExperience
    ).toBe(false);
    // An unpicked draft drops at serialization.
    expect(JSON.stringify(toTechnicianCreatePayload(validValues))).not.toContain(
      "hasModernRefrigerantExperience"
    );
  });
});

describe("toTechnicianUpdatePayload", () => {
  it("keeps workshopId off the PATCH body and carries the core fields", () => {
    const payload = toTechnicianUpdatePayload(validValues);
    expect(payload).toEqual({
      fullName: "احمد سمير",
      fullNameAr: null,
      mobile: "01012345678",
      specialty: null,
      yearsOfExperience: 5,
      employmentType: "engineer",
      employmentNature: undefined,
      hasModernRefrigerantExperience: undefined,
      address: "القاهرة",
      notes: null,
    });
    expect(payload).not.toHaveProperty("workshopId");
  });

  it("omits a cleared years draft so the stored value is left unchanged", () => {
    const payload = toTechnicianUpdatePayload({ ...validValues, yearsOfExperience: "" });
    expect(payload).not.toHaveProperty("yearsOfExperience");
  });

  it("sends a cleared mobile as null (nullable column), never an empty string", () => {
    const payload = toTechnicianUpdatePayload({ ...validValues, mobile: "" });
    expect(payload.mobile).toBeNull();
  });

  // Registry fields (REGISTRY-GAS-SPEC §2): untouched unset → omitted (= keep on the
  // wire); explicitly cleared → "" (clear); value → set.
  it("omits untouched unset registry drafts so the stored values are kept", () => {
    const payload = toTechnicianUpdatePayload({
      ...validValues,
      employmentType: "",
      employmentNature: "",
      hasModernRefrigerantExperience: "",
      address: "",
    });
    // The keys ride as undefined — undefined drops at JSON serialization (keep).
    expect(payload.employmentType).toBeUndefined();
    expect(payload.employmentNature).toBeUndefined();
    expect(payload.hasModernRefrigerantExperience).toBeUndefined();
    expect(payload.address).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("employmentType");
  });

  it("sends explicitly cleared registry drafts as \"\" (clear)", () => {
    const original = {
      employmentType: "engineer",
      employmentNature: "selfEmployed",
      address: "القاهرة",
    } as const;
    const payload = toTechnicianUpdatePayload(
      {
        ...validValues,
        employmentType: "",
        employmentNature: "",
        address: "",
      },
      { ...technicianStub, ...original }
    );
    expect(payload.employmentType).toBe("");
    expect(payload.employmentNature).toBe("");
    expect(payload.address).toBe("");
  });

  it("sends changed registry drafts as values and unchanged ones with their stored values", () => {
    const original = {
      employmentType: "engineer",
      address: "القاهرة",
    } as const;
    const payload = toTechnicianUpdatePayload(
      {
        ...validValues,
        employmentType: "observer",
        address: "القاهرة",
      },
      { ...technicianStub, ...original }
    );
    expect(payload.employmentType).toBe("observer");
    // Untouched set fields travel as their stored values (value = set, a no-op).
    expect(payload.address).toBe("القاهرة");
  });

  it('2026-11-17 manual identity: gender follows ""-clears and age travels only when set', () => {
    // Set: a picked gender draft travels; a set age travels as its number.
    const set = toTechnicianUpdatePayload(
      { ...validValues, gender: "female", age: 41 },
      technicianStub
    );
    expect(set.gender).toBe("female");
    expect(set.age).toBe(41);

    // Keep: blank drafts over a STORED gender still clear it (the "" convention) —
    // a blank age draft omits the key (no clear path).
    const clear = toTechnicianUpdatePayload(validValues, {
      ...technicianStub,
      gender: "male",
      age: 30,
    });
    expect(clear.gender).toBe("");
    expect(clear.age).toBeUndefined();
    expect(JSON.stringify(clear)).not.toContain('"age"');

    // Blank drafts over NOTHING stored omit both keys.
    const keep = toTechnicianUpdatePayload(validValues, technicianStub);
    expect(keep.gender).toBeUndefined();
    expect(keep.age).toBeUndefined();
  });

  it("§11 nature follows set/clear/keep and the flag only travels when picked", () => {
    // Set: a new nature draft travels; a picked yes/no draft travels as the boolean.
    const set = toTechnicianUpdatePayload(
      { ...validValues, employmentNature: "selfEmployed", hasModernRefrigerantExperience: "yes" },
      technicianStub
    );
    expect(set.employmentNature).toBe("selfEmployed");
    expect(set.hasModernRefrigerantExperience).toBe(true);

    // Keep/omit: blank drafts over NOTHING stored omit both keys (the §2 three-way
    // contract); the flag itself has no clear path — unpicked never travels.
    const keep = toTechnicianUpdatePayload(validValues, technicianStub);
    expect(keep.employmentNature).toBeUndefined();
    expect(keep.hasModernRefrigerantExperience).toBeUndefined();
    expect(JSON.stringify(keep)).not.toContain("employmentNature");
    expect(JSON.stringify(keep)).not.toContain("hasModernRefrigerantExperience");
  });
});

describe("toFormValues", () => {
  it("seeds blank values for create mode, honoring a locked workshop", () => {
    expect(toFormValues(null, "w-9")).toEqual({
      fullName: "",
      fullNameAr: "",
      gender: "",
      age: "",
      mobile: "",
      workshopId: "w-9",
      specialty: "",
      yearsOfExperience: 0,
      employmentType: "",
      employmentNature: "",
      hasModernRefrigerantExperience: "",
      address: "",
      notes: "",
    });
  });

  it("seeds an empty workshop for create mode without a locked workshop", () => {
    expect(toFormValues(null).workshopId).toBe("");
  });

  it("seeds the manual identity + registry fields from an existing technician", () => {
    const values = toFormValues({
      ...technicianStub,
      gender: "female",
      age: 37,
      employmentType: "observer",
      employmentNature: "temporary",
      hasModernRefrigerantExperience: true,
    });
    expect(values.gender).toBe("female");
    expect(values.age).toBe(37);
    expect(values.employmentType).toBe("observer");
    expect(values.employmentNature).toBe("temporary");
    expect(values.hasModernRefrigerantExperience).toBe("yes");
    expect(toFormValues({ ...technicianStub, hasModernRefrigerantExperience: false })
      .hasModernRefrigerantExperience).toBe("no");
    expect(toFormValues(technicianStub).hasModernRefrigerantExperience).toBe("");
  });
});

describe("specialty select helpers", () => {
  it("offers exactly the three qualification options per the spec", () => {
    expect([...SPECIALIZATION_OPTIONS]).toEqual(["مؤهل عالي", "مؤهل متوسط", "بدون"]);
  });

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

  it("still renders legacy stored role names as free text (no longer offered options)", () => {
    expect(isCustomSpecialty("فني تبريد وتكييف")).toBe(true);
    expect(specialtySelectValue("فني تبريد وتكييف")).toBe(SPECIALTY_OTHER_SENTINEL);
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
