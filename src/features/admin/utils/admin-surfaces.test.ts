import { describe, expect, it } from "vitest";
import { visibleSurfaces } from "./admin-surfaces";

describe("visibleSurfaces", () => {
  it("shows the SuperAdmin every surface in fixed order", () => {
    const surfaces = visibleSurfaces(["*"]).map((surface) => surface.key);
    expect(surfaces).toEqual(["users", "permissions", "audit"]);
  });

  it("shows only the audit surface for the PM matrix", () => {
    const surfaces = visibleSurfaces(["admin:audit", "workshops:create", "selection:view"]).map(
      (surface) => surface.key
    );
    expect(surfaces).toEqual(["audit"]);
  });

  it("shows the permissions surface for admin:permissions holders", () => {
    const surfaces = visibleSurfaces(["admin:permissions"]).map((surface) => surface.key);
    expect(surfaces).toEqual(["permissions"]);
  });

  it("returns nothing without any admin permission", () => {
    expect(visibleSurfaces(["workshops:view"])).toEqual([]);
  });
});
