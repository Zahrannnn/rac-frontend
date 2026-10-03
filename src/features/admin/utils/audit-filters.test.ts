import { describe, expect, it } from "vitest";
import { auditFiltersToQuery, parseAuditFilters } from "./audit-filters";

describe("parseAuditFilters", () => {
  it("parses page, entity, action and user", () => {
    const filters = parseAuditFilters(
      new URLSearchParams("page=2&entity=Workshop&action=Modified&user=admin")
    );
    expect(filters).toEqual({
      page: 2,
      entityName: "Workshop",
      action: "Modified",
      username: "admin",
    });
  });

  it("drops unknown actions and empty values", () => {
    const filters = parseAuditFilters(new URLSearchParams("action=Upgraded&entity=&user="));
    expect(filters.action).toBeUndefined();
    expect(filters.entityName).toBeUndefined();
    expect(filters.username).toBeUndefined();
  });

  it("clamps the page to at least 1", () => {
    expect(parseAuditFilters(new URLSearchParams("page=-1")).page).toBe(1);
  });
});

describe("auditFiltersToQuery", () => {
  it("returns an empty string for defaults", () => {
    expect(auditFiltersToQuery({ page: 1 })).toBe("");
  });

  it("encodes every set filter and round-trips", () => {
    const query = auditFiltersToQuery({
      page: 3,
      entityName: "Survey",
      action: "Deleted",
      username: "field.demo",
    });
    expect(query).toBe("?page=3&entity=Survey&action=Deleted&user=field.demo");
    expect(parseAuditFilters(new URLSearchParams(query.slice(1)))).toEqual({
      page: 3,
      entityName: "Survey",
      action: "Deleted",
      username: "field.demo",
    });
  });
});
