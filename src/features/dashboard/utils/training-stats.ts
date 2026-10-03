import { GOVERNORATES } from "@/shared/constants/egypt";
import type { TrainingListItem } from "@/features/trainings/types";

/** Aggregate the trainings list for the dashboard panel. `now` defaults to the
 * real clock and is injectable so tests stay deterministic. */
export function computeTrainingStats(
  items: TrainingListItem[],
  totalCount: number,
  now: number = Date.now()
) {
  const completed = items.filter((row) => new Date(row.endAtUtc).getTime() < now);
  const upcoming = items.filter((row) => new Date(row.endAtUtc).getTime() >= now);
  const attendees = items.reduce((sum, row) => sum + (row.attendeeCount ?? 0), 0);

  const byGovernorate = GOVERNORATES.map((governorate) => ({
    governorate,
    count: items.filter((row) => row.governorate === governorate).length,
  }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count);

  const months: { label: string; count: number }[] = [];
  const cursor = new Date(now);
  cursor.setUTCDate(1);
  cursor.setUTCMonth(cursor.getUTCMonth() - 5);
  for (let i = 0; i < 6; i++) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    months.push({
      label: `${cursor.getUTCFullYear()}/${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`,
      count: items.filter((row) => row.startAtUtc.startsWith(key)).length,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return {
    total: totalCount,
    completed: completed.length,
    upcoming: upcoming.length,
    attendees,
    avgAttendees: items.length ? Math.round((attendees / items.length) * 10) / 10 : 0,
    byGovernorate,
    months,
    maxMonth: Math.max(1, ...months.map((m) => m.count)),
  };
}
