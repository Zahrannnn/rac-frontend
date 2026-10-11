import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { racApi } from "@/shared/api/rac-api";
import { fetchSelectionRuns, normalizeRunKind } from "./selection-adapter";
import type { SelectionRunSummary } from "../types";

vi.mock("@/shared/api/rac-api", () => ({
  racApi: { get: vi.fn(), post: vi.fn(), request: vi.fn(), downloadBlob: vi.fn() },
}));

const getMock = racApi.get as unknown as Mock;

describe("normalizeRunKind (wire PascalCase → feature lowercase)", () => {
  it("maps the API's PascalCase enum values", () => {
    expect(normalizeRunKind("Participation")).toBe("participation");
    expect(normalizeRunKind("Equipment")).toBe("equipment");
  });

  it("passes already-lowercase values through", () => {
    expect(normalizeRunKind("participation")).toBe("participation");
    expect(normalizeRunKind("equipment")).toBe("equipment");
  });

  it("degrades unknown or missing values to participation", () => {
    expect(normalizeRunKind(undefined)).toBe("participation");
    expect(normalizeRunKind(null)).toBe("participation");
    expect(normalizeRunKind("")).toBe("participation");
    expect(normalizeRunKind("nonsense")).toBe("participation");
  });
});

describe("fetchSelectionRuns regression: wire PascalCase kinds", () => {
  it("normalizes the list so chips and equipment-run gating work", async () => {
    const run = { id: "r1", kind: "Participation" } as unknown as SelectionRunSummary;
    getMock.mockResolvedValueOnce({ data: { items: [run], page: 1, pageSize: 10, totalCount: 1, totalPages: 1 } });

    const result = await fetchSelectionRuns();

    expect(result.items[0].kind).toBe("participation");
  });
});
