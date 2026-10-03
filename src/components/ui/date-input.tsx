"use client";

import { useState, type ChangeEvent, type FocusEvent, type KeyboardEvent } from "react";
import { cn } from "@/shared/utils/cn";

type DateParts = { day: number; month: number; year: number };

type DateInputProps = {
  value?: Date;
  onChange: (date: Date) => void;
  id?: string;
  "aria-label"?: string;
};

function toParts(value?: Date): DateParts {
  const d = value ? new Date(value) : new Date();
  return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
}

function isValidParts(parts: DateParts): boolean {
  if (parts.day < 1 || parts.day > 31 || parts.month < 1 || parts.month > 12) return false;
  if (parts.year < 1000 || parts.year > 9999) return false;
  const d = new Date(parts.year, parts.month - 1, parts.day);
  return (
    d.getFullYear() === parts.year &&
    d.getMonth() + 1 === parts.month &&
    d.getDate() === parts.day
  );
}

/**
 * Segmented MM/DD/YYYY entry (Western digits, LTR) — adapted from
 * johnpolacek/date-range-picker-for-shadcn (MIT).
 */
export function DateInput({ value, onChange, id, "aria-label": ariaLabel }: DateInputProps) {
  const valueAt = value?.getTime() ?? 0;
  const [parts, setParts] = useState<DateParts>(() => toParts(value));
  const [syncedAt, setSyncedAt] = useState(valueAt);
  const [monthEl, setMonthEl] = useState<HTMLInputElement | null>(null);
  const [dayEl, setDayEl] = useState<HTMLInputElement | null>(null);
  const [yearEl, setYearEl] = useState<HTMLInputElement | null>(null);

  if (valueAt !== syncedAt) {
    setSyncedAt(valueAt);
    setParts(toParts(value));
  }

  const tryCommit = (next: DateParts) => {
    setParts(next);
    if (isValidParts(next)) {
      onChange(new Date(next.year, next.month - 1, next.day));
    }
  };

  const handleChange =
    (field: keyof DateParts) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      if (raw === "") {
        setParts((prev) => ({ ...prev, [field]: 0 }));
        return;
      }
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) return;
      tryCommit({ ...parts, [field]: numeric });
    };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (!event.target.value || !isValidParts(parts)) {
      setParts(toParts(value));
    }
  };

  const handleKeyDown = (field: keyof DateParts) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.metaKey || event.ctrlKey) return;

    if (
      !/^[0-9]$/.test(event.key) &&
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Delete", "Tab", "Backspace", "Enter"].includes(
        event.key
      )
    ) {
      event.preventDefault();
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const delta = event.key === "ArrowUp" ? 1 : -1;
      const next = { ...parts };
      if (field === "day") {
        const maxDay = new Date(parts.year, parts.month, 0).getDate();
        next.day = parts.day + delta;
        if (next.day > maxDay) {
          next.day = 1;
          next.month += 1;
          if (next.month > 12) {
            next.month = 1;
            next.year += 1;
          }
        } else if (next.day < 1) {
          next.month -= 1;
          if (next.month < 1) {
            next.month = 12;
            next.year -= 1;
          }
          next.day = new Date(next.year, next.month, 0).getDate();
        }
      } else if (field === "month") {
        next.month += delta;
        if (next.month > 12) {
          next.month = 1;
          next.year += 1;
        } else if (next.month < 1) {
          next.month = 12;
          next.year -= 1;
        }
      } else {
        next.year += delta;
      }
      tryCommit(next);
      return;
    }

    if (event.key === "ArrowRight") {
      const atEnd =
        event.currentTarget.selectionStart === event.currentTarget.value.length ||
        (event.currentTarget.selectionStart === 0 &&
          event.currentTarget.selectionEnd === event.currentTarget.value.length);
      if (atEnd) {
        event.preventDefault();
        if (field === "month") dayEl?.focus();
        if (field === "day") yearEl?.focus();
      }
    } else if (event.key === "ArrowLeft") {
      const atStart = event.currentTarget.selectionStart === 0;
      if (atStart) {
        event.preventDefault();
        if (field === "day") monthEl?.focus();
        if (field === "year") dayEl?.focus();
      }
    }
  };

  const fieldClass =
    "w-7 border-none bg-transparent p-0 text-center text-sm tabular-nums outline-none focus:ring-0";

  return (
    <div
      id={id}
      role="group"
      aria-label={ariaLabel}
      dir="ltr"
      className="flex h-9 items-center rounded-md border bg-background px-2 font-mono text-sm tabular-nums"
    >
      <input
        ref={setMonthEl}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="MM"
        aria-label="Month"
        value={parts.month || ""}
        onChange={handleChange("month")}
        onKeyDown={handleKeyDown("month")}
        onFocus={(event) => event.target.select()}
        onBlur={handleBlur}
        className={cn(fieldClass, "w-6")}
      />
      <span className="text-muted-foreground" aria-hidden>
        /
      </span>
      <input
        ref={setDayEl}
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="DD"
        aria-label="Day"
        value={parts.day || ""}
        onChange={handleChange("day")}
        onKeyDown={handleKeyDown("day")}
        onFocus={(event) => event.target.select()}
        onBlur={handleBlur}
        className={fieldClass}
      />
      <span className="text-muted-foreground" aria-hidden>
        /
      </span>
      <input
        ref={setYearEl}
        type="text"
        inputMode="numeric"
        maxLength={4}
        placeholder="YYYY"
        aria-label="Year"
        value={parts.year || ""}
        onChange={handleChange("year")}
        onKeyDown={handleKeyDown("year")}
        onFocus={(event) => event.target.select()}
        onBlur={handleBlur}
        className={cn(fieldClass, "w-12")}
      />
    </div>
  );
}
