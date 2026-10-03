import { describe, expect, it } from "vitest";
import { groupColumns, matrixColumns, rowPayload, togglePermission } from "./matrix";
import type { RolePermissionsRow } from "../types";

const rows: RolePermissionsRow[] = [
  { role: "FieldTeams", permissions: ["surveys:view", "surveys:create", "workshops:view"] },
  { role: "Unido", permissions: ["selection:view", "reports:generate"] },
];

describe("matrixColumns", () => {
  it("unions granted permissions in canonical function→action order", () => {
    const columns = matrixColumns(rows);
    expect(columns).toEqual([
      "workshops:view",
      "surveys:view",
      "surveys:create",
      "selection:view",
      "reports:generate",
    ]);
  });

  it("returns an empty grid without any grants", () => {
    expect(matrixColumns([{ role: "X", permissions: [] }])).toEqual([]);
  });
});

describe("groupColumns", () => {
  it("splits the ordered columns into contiguous function groups", () => {
    const columns = matrixColumns(rows);
    const groups = groupColumns(columns);
    expect(groups).toEqual([
      { func: "workshops", permissions: ["workshops:view"] },
      { func: "surveys", permissions: ["surveys:view", "surveys:create"] },
      { func: "selection", permissions: ["selection:view"] },
      { func: "reports", permissions: ["reports:generate"] },
    ]);
  });

  it("merges adjacent permissions of the same function into one group", () => {
    const groups = groupColumns(["reports:generate", "reports:manage", "reports:generate"]);
    expect(groups).toEqual([
      {
        func: "reports",
        permissions: ["reports:generate", "reports:manage", "reports:generate"],
      },
    ]);
  });

  it("returns no groups for an empty grid", () => {
    expect(groupColumns([])).toEqual([]);
  });
});

describe("togglePermission", () => {
  it("removes a granted permission", () => {
    expect(togglePermission(["surveys:create", "workshops:view"], "surveys:create")).toEqual([
      "workshops:view",
    ]);
  });

  it("adds and re-sorts a denied permission", () => {
    const next = togglePermission(["surveys:view"], "workshops:view");
    expect(next).toEqual(["workshops:view", "surveys:view"]);
  });

  it("does not duplicate", () => {
    expect(togglePermission(["surveys:view"], "surveys:view")).toEqual([]);
  });
});

describe("rowPayload", () => {
  it("de-duplicates the grant list for the whole-row PUT", () => {
    expect(rowPayload(["a:x", "a:x", "b:y"])).toEqual(["a:x", "b:y"]);
  });
});
