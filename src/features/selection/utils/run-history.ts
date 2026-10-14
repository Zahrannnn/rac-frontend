import type { SelectionRunSummary } from "../types";

/** One participation run and the equipment runs derived from it. */
export type SelectionRunGroup = {
  run: SelectionRunSummary;
  children: SelectionRunSummary[];
};

/**
 * Audit-trail grouping (presentation only — the wire shape carries no parent id):
 * nest each equipment run under the most recent participation run with an earlier
 * `runAtUtc` among the loaded items (the list is newest-first, so the first match
 * is the right parent). An equipment run whose parent sits outside the loaded page
 * (pagination boundary) stays flat.
 */
export function groupRunsForHistory(items: SelectionRunSummary[]): SelectionRunGroup[] {
  const groups = new Map<string, SelectionRunGroup>();
  const order: SelectionRunGroup[] = [];

  for (const run of items) {
    if (run.kind === "equipment") {
      // Date.parse, not string compare: System.Text.Json only emits fractional
      // seconds when nonzero, so equal-second timestamps would mis-sort lexically.
      const parent = items.find(
        (candidate) =>
          candidate.kind === "participation" &&
          Date.parse(candidate.runAtUtc) < Date.parse(run.runAtUtc)
      );
      if (parent) {
        const existing = groups.get(parent.id);
        if (existing) {
          existing.children.push(run);
        } else {
          // The equipment run is newer than its parent, so it can be walked first.
          const group: SelectionRunGroup = { run: parent, children: [run] };
          groups.set(parent.id, group);
          order.push(group);
        }
        continue;
      }
    }
    if (run.kind === "participation" && groups.has(run.id)) {
      continue; // already grouped by an equipment run walked earlier
    }
    const group: SelectionRunGroup = { run, children: [] };
    groups.set(run.id, group);
    order.push(group);
  }

  return order;
}
