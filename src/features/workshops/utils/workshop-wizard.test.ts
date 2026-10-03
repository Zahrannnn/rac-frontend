import { describe, expect, it } from "vitest";
import {
  buildCreatePayload,
  collectStepErrors,
  districtReset,
  initialWizardState,
  isWizardStepValid,
} from "./workshop-wizard";
import { ar } from "@/shared/i18n";
import { OTHER_DISTRICT } from "@/shared/constants/districts";

/** Real dictionary lookup — exercises the actual Arabic messages. */
const t = ((key: string, params?: Record<string, string | number>) => {
  let text = (ar as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}) as ReturnType<() => typeof ar extends never ? never : never>;

// minimal cast helper so the tests compile against the useT-derived TFunc type
const translate = t as unknown as Parameters<typeof collectStepErrors>[2];

describe("initialWizardState", () => {
  it("seeds a Draft-step form with empty values and Cairo as default governorate", () => {
    const state = initialWizardState();
    expect(state.basic.type).toBe("Formal");
    expect(state.location.governorate).toBe("Cairo");
    expect(state.location.latitude).toBeNull();
    expect(state.notes).toBe("");
  });
});

describe("isWizardStepValid", () => {
  it("steps 0 and 3 have no field rules", () => {
    expect(isWizardStepValid(0, initialWizardState())).toBe(true);
    expect(isWizardStepValid(3, initialWizardState())).toBe(true);
  });

  /** A step-1 state that passes validation; individual tests perturb one field. */
  function aValidBasicState() {
    const state = initialWizardState();
    state.basic.nameEn = "Nasr Workshop";
    state.basic.ownerName = "Samir";
    state.basic.mobile = "01012345678";
    return state;
  }

  it("step 1 requires the Egyptian mobile format", () => {
    const state = aValidBasicState();
    state.basic.mobile = "01312345678";
    expect(isWizardStepValid(1, state)).toBe(false);
    state.basic.mobile = "01012345678";
    expect(isWizardStepValid(1, state)).toBe(true);
  });

  it("step 2 rejects half-provided GPS pairs", () => {
    const state = initialWizardState();
    state.location.address = "1 Tahrir Sq";
    state.location.latitude = 30.05;
    expect(isWizardStepValid(2, state)).toBe(false);
    state.location.longitude = 31.24;
    expect(isWizardStepValid(2, state)).toBe(true);
  });

  it("step 2 blocks Other selected with an empty manual entry", () => {
    const state = initialWizardState();
    state.location.address = "1 Tahrir Sq";
    state.location.districtOther = true;
    expect(isWizardStepValid(2, state)).toBe(false);

    state.location.district = "المعادي الحديثة";
    expect(isWizardStepValid(2, state)).toBe(true);
    expect(state.location.district).not.toBe(OTHER_DISTRICT);
  });
});

describe("districtReset", () => {
  it("wipes both the picked district and the Other flag", () => {
    expect(districtReset()).toEqual({ district: "", districtOther: false });
  });
});

describe("collectStepErrors", () => {
  it("maps the mobile failure to its Arabic message", () => {
    const state = initialWizardState();
    state.basic.mobile = "bad";
    const errors = collectStepErrors(1, state, translate);
    expect(errors.mobile).toBe("أدخل رقم جوال مصري صحيح (01XXXXXXXXX)");
  });

  it("collects multiple failing fields at once", () => {
    const errors = collectStepErrors(1, initialWizardState(), translate);
    expect(Object.keys(errors)).toEqual(
      expect.arrayContaining(["nameEn", "ownerName", "mobile"])
    );
  });

  it("returns no errors for a valid location step", () => {
    const state = initialWizardState();
    state.location.address = "1 Tahrir Sq";
    expect(collectStepErrors(2, state, translate)).toEqual({});
  });

  it("maps an empty Other-district manual entry to validation.districtRequired", () => {
    const state = initialWizardState();
    state.location.address = "1 Tahrir Sq";
    state.location.districtOther = true;
    const errors = collectStepErrors(2, state, translate);
    expect(errors.district).toBe((ar as Record<string, string>)["validation.districtRequired"]);
  });

  it("keeps no district error once the manual text is typed", () => {
    const state = initialWizardState();
    state.location.address = "1 Tahrir Sq";
    state.location.districtOther = true;
    state.location.district = "  العبور  ";
    expect(collectStepErrors(2, state, translate)).toEqual({});
  });
});

describe("buildCreatePayload", () => {
  it("merges the probe with wizard state and carries ConfirmDuplicate", () => {
    const state = initialWizardState();
    state.basic.nameAr = "ورشة النصر";
    state.notes = "ملاحظة";
    const payload = buildCreatePayload(
      state,
      {
        nameEn: "Nasr Workshop",
        ownerName: "Samir",
        mobile: "01012345678",
        address: "1 Tahrir Sq",
        governorate: "Cairo",
        latitude: 30.05,
        longitude: 31.24,
        confirmDuplicate: true,
      }
    );

    expect(payload.nameAr).toBe("ورشة النصر");
    expect(payload.notes).toBe("ملاحظة");
    expect(payload.confirmDuplicate).toBe(true);
    expect(payload.type).toBe("Formal");
  });

  it("submits the manual district text and never the sentinel", () => {
    const state = initialWizardState();
    state.location.districtOther = true;
    state.location.district = "حي غير مدرج";
    const payload = buildCreatePayload(state, {
      nameEn: "Nasr Workshop",
      ownerName: "Samir",
      mobile: "01012345678",
      address: "1 Tahrir Sq",
      governorate: "Cairo",
      latitude: 30.05,
      longitude: 31.24,
      confirmDuplicate: false,
    });
    expect(payload.district).toBe("حي غير مدرج");

    state.location.district = "";
    const empty = buildCreatePayload(state, {
      nameEn: "Nasr Workshop",
      ownerName: "Samir",
      mobile: "01012345678",
      address: "1 Tahrir Sq",
      governorate: "Cairo",
      latitude: 30.05,
      longitude: 31.24,
      confirmDuplicate: false,
    });
    expect(empty.district).toBeUndefined();
    expect(JSON.stringify(empty)).not.toContain(OTHER_DISTRICT);
  });
});
