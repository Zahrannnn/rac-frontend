import type { AuditAction } from "../types";

export type ChangeLine = {
  field: string;
  /** For Modified rows: previous → current. For Added/Deleted: the snapshot value. */
  from?: string;
  to?: string;
};

function stringify(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Normalize the audit Changes payload into display rows. The backend writes
 * { field: { from, to } } for Modified entries and flat { field: value }
 * snapshots for Added/Deleted entries (AppDbContext audit interceptor).
 */
export function parseChanges(action: AuditAction, changes: Record<string, unknown>): ChangeLine[] {
  return Object.entries(changes).map(([field, value]) => {
    if (action === "Modified" && value !== null && typeof value === "object") {
      const pair = value as { from?: unknown; to?: unknown };
      return { field, from: stringify(pair.from), to: stringify(pair.to) };
    }
    return { field, to: stringify(value) };
  });
}

/** One-line summary for the table cell — first two changed fields, then "+N". */
export function summarizeChanges(lines: ChangeLine[]): string {
  if (lines.length === 0) {
    return "—";
  }
  const head = lines
    .slice(0, 2)
    .map((line) => line.field)
    .join(", ");
  const rest = lines.length - 2;
  return rest > 0 ? `${head} +${rest}` : head;
}
