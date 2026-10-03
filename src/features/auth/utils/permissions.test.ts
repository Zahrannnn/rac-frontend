import { describe, expect, it } from "vitest";
import { can, canAny } from "./permissions";

describe("can", () => {
  it("grants nothing with an empty permission list", () => {
    expect(can([], "workshops:view")).toBe(false);
  });

  it("grants a listed key", () => {
    expect(can(["workshops:view", "surveys:view"], "workshops:view")).toBe(true);
  });

  it("denies an unlisted key", () => {
    expect(can(["workshops:view"], "selection:view")).toBe(false);
  });

  it("grants everything to the SuperAdmin '*' sentinel", () => {
    expect(can(["*"], "admin:permissions")).toBe(true);
    expect(can(["*"], "reports:generate")).toBe(true);
  });
});

describe("canAny", () => {
  it("requires at least one granted key", () => {
    expect(canAny(["surveys:view"], ["admin:users", "admin:audit"])).toBe(false);
    expect(canAny(["admin:audit"], ["admin:users", "admin:audit"])).toBe(true);
  });

  it("grants everything to the '*' sentinel", () => {
    expect(canAny(["*"], ["admin:users", "admin:audit", "admin:permissions"])).toBe(true);
  });

  it("returns false for an empty key set", () => {
    expect(canAny(["workshops:view"], [])).toBe(false);
  });
});
