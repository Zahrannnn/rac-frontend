"use client";

import { cn } from "@/shared/utils/cn";

// Shared matrix-table header cells (uppercase corner / centered range-scale column).
export const TH_CORNER =
  "border p-2 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground";
export const TH_COL_CENTER = "border p-2 text-center text-xs font-semibold text-muted-foreground";

/** One Likert-style radio dot cell (shared by the seasonal/range/likert tables). */
export function RadioDot({
  active,
  label,
  onSelect,
}: {
  active: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        "size-6 rounded-full border-2",
        active ? "border-primary bg-primary" : "border-muted-foreground/50"
      )}
    />
  );
}

/** Segmented single-choice row (used by checklist and per-row matrices). */
export function SegmentedRow({
  name,
  value,
  options,
  onSelect,
  labelFor,
}: {
  name: string;
  value: string | null;
  options: readonly string[];
  onSelect: (option: string) => void;
  labelFor?: (option: string) => string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(option)}
            className={cn(
              "min-h-11 rounded-md border px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-[var(--accent-foreground)]"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {labelFor ? labelFor(option) : option}
          </button>
        );
      })}
    </div>
  );
}
