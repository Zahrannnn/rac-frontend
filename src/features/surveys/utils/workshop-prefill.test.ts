import { describe, expect, it } from "vitest";
import {
  toLocalMobile,
  withWorkshopContext,
  type WorkshopSurveyContext,
} from "./workshop-prefill";
import { PILOT_GOVERNORATE_OPTIONS } from "../schema";

const FULL_WORKSHOP: WorkshopSurveyContext = {
  code: "MAC-CAR-000125",
  name: "ورشة النور",
  ownerName: "محمد عبدالله",
  governorate: "Cairo",
  district: "مركز سيدي سالم",
  address: "شارع البحر، أمام المسجد",
  mobile: "201012345678",
};

describe("toLocalMobile", () => {
  it("passes through an already-local number", () => {
    expect(toLocalMobile("01012345678")).toBe("01012345678");
  });

  it("converts the stored international-normalized form", () => {
    expect(toLocalMobile("201012345678")).toBe("01012345678");
  });

  it("tolerates separators and rejects unconvertible numbers", () => {
    expect(toLocalMobile("+20 100 123 4567")).toBe("01001234567");
    expect(toLocalMobile("9012345678")).toBeNull();
    expect(toLocalMobile("not-a-phone")).toBeNull();
  });
});

describe("withWorkshopContext", () => {
  it("fills every overlapping basicInfo field from the workshop record", () => {
    const seeded = withWorkshopContext(undefined, FULL_WORKSHOP);
    expect(seeded).toEqual({
      projectCode: "MAC-CAR-000125",
      workshopName: "ورشة النور",
      ownerOrManagerName: "محمد عبدالله",
      governorate: "cairo",
      district: "مركز سيدي سالم",
      address: "شارع البحر، أمام المسجد",
      phoneWhatsapp: "01012345678",
    });
  });

  it("maps the governorate onto an option the survey enum actually offers", () => {
    const seeded = withWorkshopContext(undefined, FULL_WORKSHOP);
    expect(PILOT_GOVERNORATE_OPTIONS).toContain(seeded.governorate);
  });

  it("skips governorates outside the three pilot options (invalid enum would flag the section)", () => {
    const seeded = withWorkshopContext(undefined, {
      ...FULL_WORKSHOP,
      governorate: "Kafr El Sheikh",
    });
    expect(seeded.governorate).toBeUndefined();
  });

  it("never overwrites answers the surveyor already gave", () => {
    const seeded = withWorkshopContext(
      { workshopName: "اسم مصحح ميدانيًا", governorate: "cairo" },
      FULL_WORKSHOP
    );
    expect(seeded.workshopName).toBe("اسم مصحح ميدانيًا");
    expect(seeded.governorate).toBe("cairo");
    expect(seeded.ownerOrManagerName).toBe("محمد عبدالله");
  });

  it("skips missing workshop fields and unconvertible phones", () => {
    const seeded = withWorkshopContext(undefined, {
      code: "MAC-CAR-000001",
      mobile: "broken",
    });
    expect(seeded).toEqual({ projectCode: "MAC-CAR-000001" });
  });

  it("ignores governorates outside the canonical list", () => {
    const seeded = withWorkshopContext(undefined, { governorate: "Atlantis" });
    expect(seeded.governorate).toBeUndefined();
  });

  it("returns a copy when there is no workshop context", () => {
    const answers = { workshopName: "x" };
    expect(withWorkshopContext(answers, null)).toEqual(answers);
  });
});
