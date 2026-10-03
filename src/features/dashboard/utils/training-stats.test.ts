import { describe, expect, it } from "vitest";
import type { TrainingListItem } from "@/features/trainings/types";
import { computeTrainingStats } from "./training-stats";

const NOW = Date.UTC(2026, 5, 15, 12); // 2026-06-15T12:00Z

function row(overrides: Partial<TrainingListItem>): TrainingListItem {
  return {
    id: "t1",
    trainerName: "Trainer",
    venue: "Venue",
    governorate: "Cairo",
    startAtUtc: "2026-02-10T09:00:00Z",
    endAtUtc: "2026-02-12T09:00:00Z",
    ...overrides,
  };
}

describe("computeTrainingStats", () => {
  it("splits completed/upcoming and aggregates attendees, geography and months", () => {
    const items = [
      row({ id: "a", governorate: "Cairo", attendeeCount: 10 }),
      row({
        id: "b",
        governorate: "Giza",
        startAtUtc: "2026-06-20T09:00:00Z",
        endAtUtc: "2026-06-25T09:00:00Z",
        attendeeCount: 5,
      }),
      row({
        id: "c",
        startAtUtc: "2025-12-01T09:00:00Z",
        endAtUtc: "2025-12-02T09:00:00Z",
      }),
    ];

    const stats = computeTrainingStats(items, 7, NOW);

    expect(stats).toEqual({
      total: 7,
      completed: 2,
      upcoming: 1,
      attendees: 15,
      avgAttendees: 5,
      byGovernorate: [
        { governorate: "Cairo", count: 2 },
        { governorate: "Giza", count: 1 },
      ],
      months: [
        { label: "2026/01", count: 0 },
        { label: "2026/02", count: 1 },
        { label: "2026/03", count: 0 },
        { label: "2026/04", count: 0 },
        { label: "2026/05", count: 0 },
        { label: "2026/06", count: 1 },
      ],
      maxMonth: 1,
    });
  });

  it("stays at zero for an empty list", () => {
    const stats = computeTrainingStats([], 0, NOW);

    expect(stats.total).toBe(0);
    expect(stats.avgAttendees).toBe(0);
    expect(stats.byGovernorate).toEqual([]);
    expect(stats.months).toHaveLength(6);
    expect(stats.maxMonth).toBe(1);
  });
});
