import { describe, expect, it } from "vitest";
import { filterNavItems, navItems } from "./nav";

const hrefs = (permissions: readonly string[]) =>
  filterNavItems(navItems, permissions).map((item) => item.href);

describe("filterNavItems", () => {
  it("shows everything to the SuperAdmin '*' sentinel", () => {
    expect(hrefs(["*"])).toHaveLength(navItems.length);
  });

  it("always shows the always-visible items even with no permissions", () => {
    const visible = hrefs([]);
    expect(visible).toContain("/dashboard");
    expect(visible).toHaveLength(1);
  });

  it("shows only Dashboard, Selection and Reports for the UNIDO matrix", () => {
    // Per the RBAC matrix: Unido gets selection:view + reports:generate only.
    expect(hrefs(["selection:view", "reports:generate"])).toEqual([
      "/dashboard",
      "/selection",
      "/reports",
    ]);
  });

  it("hides Selection, Reports and Admin from FieldTeams", () => {
    const visible = hrefs(["workshops:view", "technicians:view", "surveys:view"]);
    expect(visible).not.toContain("/selection");
    expect(visible).not.toContain("/reports");
    expect(visible).not.toContain("/admin");
  });

  it("shows Administration for any one admin permission (canAny semantics)", () => {
    expect(hrefs(["admin:audit"])).toContain("/admin");
    expect(hrefs(["admin:users"])).toContain("/admin");
    expect(hrefs(["admin:permissions"])).toContain("/admin");
  });
});
