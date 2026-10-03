"use client";

/** Full-width empty card with a single message line (admin tabs only). */
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border bg-card px-6 py-14 text-center">
      <p className="text-lg font-semibold text-[var(--navy)]">{message}</p>
    </div>
  );
}

/** Navy table-header cells shared by the admin tabs. */
export const TABLE_HEAD_CLASS =
  "h-11 bg-[var(--navy-shell)] text-xs font-semibold uppercase tracking-wide text-white";
