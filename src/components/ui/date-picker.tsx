"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ar as arDateFns, enUS as enDateFns } from "date-fns/locale";
import { Calendar as CalendarIcon, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateInput } from "@/components/ui/date-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useI18n, useT, type TranslationKey } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";

function pad(part: number): string {
  return String(part).padStart(2, "0");
}

/** Parse YYYY-MM-DD as a local calendar date (no TZ shift). */
export function parseDateValue(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Format a local Date as YYYY-MM-DD. */
export function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse YYYY-MM-DDTHH:mm as UTC (matches datetime helpers). */
export function parseDateTimeValue(value: string | undefined | null): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5])
    )
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Format a Date as YYYY-MM-DDTHH:mm in UTC. */
export function formatDateTimeValue(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())}`;
}

type DatePickerProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};

/**
 * Calendar localization: Arabic month/weekday names (week starting Saturday) in the
 * ar locale, English otherwise. Keeps Latin digits — the app renders numbers in
 * Western numerals throughout.
 */
function useCalendarLocale() {
  const { locale } = useI18n();
  return locale === "ar"
    ? { locale: arDateFns, displayFormat: "d MMMM yyyy" }
    : { locale: enDateFns, displayFormat: "yyyy/MM/dd" };
}

/** shadcn date picker — value is YYYY-MM-DD (empty string when cleared). */
export function DatePicker({
  id,
  value = "",
  onChange,
  placeholder,
  disabled,
  clearable = true,
  className,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const t = useT();
  const calendar = useCalendarLocale();
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const label = placeholder ?? t("common.pickDate");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-label={ariaLabel ?? label}
            data-empty={!selected}
            className={cn(
              "h-10 min-w-0 flex-1 justify-start gap-2 px-3 font-normal tabular-nums",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            <span className="truncate" dir="ltr">
              {selected ? format(selected, calendar.displayFormat, { locale: calendar.locale }) : label}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto min-w-[18.5rem] p-0" align="start" sideOffset={6}>
          <Calendar
            mode="single"
            locale={calendar.locale}
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              onChange(date ? formatDateValue(date) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {clearable && value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={disabled}
          aria-label={t("common.clearDate")}
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export type DateRangeValue = {
  from?: string;
  to?: string;
};

type InternalRange = { from: Date; to?: Date };

type DateRangePickerProps = {
  id?: string;
  value?: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  numberOfMonths?: number;
  showPresets?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};

type PresetId =
  | "today"
  | "yesterday"
  | "last7"
  | "last14"
  | "last30"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth";

const PRESETS: { id: PresetId; labelKey: TranslationKey }[] = [
  { id: "today", labelKey: "common.datePreset.today" },
  { id: "yesterday", labelKey: "common.datePreset.yesterday" },
  { id: "last7", labelKey: "common.datePreset.last7" },
  { id: "last14", labelKey: "common.datePreset.last14" },
  { id: "last30", labelKey: "common.datePreset.last30" },
  { id: "thisWeek", labelKey: "common.datePreset.thisWeek" },
  { id: "lastWeek", labelKey: "common.datePreset.lastWeek" },
  { id: "thisMonth", labelKey: "common.datePreset.thisMonth" },
  { id: "lastMonth", labelKey: "common.datePreset.lastMonth" },
];

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getPresetRange(id: PresetId): InternalRange {
  const from = new Date();
  const to = new Date();
  const weekStart = from.getDate() - from.getDay();

  switch (id) {
    case "today":
      return { from: startOfDay(from), to: endOfDay(to) };
    case "yesterday":
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "last7":
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "last14":
      from.setDate(from.getDate() - 13);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "last30":
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "thisWeek":
      from.setDate(weekStart);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "lastWeek":
      from.setDate(from.getDate() - 7 - from.getDay());
      to.setDate(to.getDate() - to.getDay() - 1);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "thisMonth":
      from.setDate(1);
      return { from: startOfDay(from), to: endOfDay(to) };
    case "lastMonth":
      from.setMonth(from.getMonth() - 1, 1);
      to.setDate(0);
      return { from: startOfDay(from), to: endOfDay(to) };
  }
}

function rangesEqual(a?: InternalRange, b?: InternalRange): boolean {
  if (!a || !b) return a === b;
  return (
    startOfDay(a.from).getTime() === startOfDay(b.from).getTime() &&
    (a.to && b.to
      ? startOfDay(a.to).getTime() === startOfDay(b.to).getTime()
      : !a.to && !b.to)
  );
}

function valueToRange(value: DateRangeValue): InternalRange | undefined {
  const from = parseDateValue(value.from);
  const to = parseDateValue(value.to);
  if (!from && !to) return undefined;
  if (from && to) return { from, to };
  if (from) return { from, to: from };
  return { from: to!, to };
}

/**
 * Date range picker adapted from johnpolacek/date-range-picker-for-shadcn (MIT):
 * presets, MM/DD/YYYY inputs, dual-month calendar, Update/Cancel.
 * Controlled via YYYY-MM-DD strings for RAC report filters.
 */
export function DateRangePicker({
  id,
  value = {},
  onChange,
  placeholder,
  disabled,
  clearable = true,
  className,
  numberOfMonths,
  showPresets = true,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const committed = valueToRange(value);
  const [draft, setDraft] = useState<InternalRange>(() => {
    const today = startOfDay(new Date());
    return committed ?? { from: today, to: today };
  });
  const months = numberOfMonths ?? (isSmallScreen ? 1 : 2);
  const label = placeholder ?? t("common.pickDateRange");
  const hasValue = Boolean(value.from || value.to);

  const display = (() => {
    const from = parseDateValue(value.from);
    const to = parseDateValue(value.to);
    if (from && to) return `${format(from, "yyyy/MM/dd")} – ${format(to, "yyyy/MM/dd")}`;
    if (from) return `${format(from, "yyyy/MM/dd")} – …`;
    return label;
  })();

  const selectedPreset = PRESETS.find((preset) =>
    rangesEqual(draft, getPresetRange(preset.id))
  )?.id;

  useEffect(() => {
    const onResize = () => setIsSmallScreen(window.innerWidth < 960);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const applyPreset = (presetId: PresetId) => {
    setDraft(getPresetRange(presetId));
  };

  const resetDraft = () => {
    const today = startOfDay(new Date());
    setDraft(committed ?? { from: today, to: today });
  };

  const commit = () => {
    onChange({
      from: draft.from ? formatDateValue(startOfDay(draft.from)) : undefined,
      to: draft.to ? formatDateValue(startOfDay(draft.to)) : undefined,
    });
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover
        open={open}
        modal
        onOpenChange={(next) => {
          if (next) {
            setDraft(committed ?? draft);
          } else {
            resetDraft();
          }
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-label={ariaLabel ?? label}
            className={cn(
              "h-10 min-w-0 flex-1 justify-between gap-2 px-3 font-normal tabular-nums",
              !hasValue && "text-muted-foreground"
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="truncate" dir="ltr">
                {display}
              </span>
            </span>
            {open ? (
              <ChevronUp className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto max-w-[calc(100vw-1.5rem)] p-0"
          align="start"
          sideOffset={6}
        >
          <div className="flex flex-col">
            <div className="flex flex-col-reverse gap-3 border-b p-3 lg:flex-row lg:items-start lg:gap-4 lg:p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <DateInput
                      aria-label={t("reports.filterDateFrom")}
                      value={draft.from}
                      onChange={(date) => {
                        const nextTo =
                          !draft.to || date > draft.to ? date : draft.to;
                        setDraft({ from: startOfDay(date), to: startOfDay(nextTo) });
                      }}
                    />
                    <span className="text-muted-foreground" aria-hidden>
                      –
                    </span>
                    <DateInput
                      aria-label={t("reports.filterDateTo")}
                      value={draft.to ?? draft.from}
                      onChange={(date) => {
                        const nextFrom = date < draft.from ? date : draft.from;
                        setDraft({ from: startOfDay(nextFrom), to: startOfDay(date) });
                      }}
                    />
                  </div>
                </div>

                {showPresets && isSmallScreen ? (
                  <Select
                    value={selectedPreset}
                    onValueChange={(presetId) => applyPreset(presetId as PresetId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("common.datePresets")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {t(preset.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}

                <Calendar
                  mode="range"
                  numberOfMonths={months}
                  selected={draft}
                  defaultMonth={
                    new Date(
                      new Date().getFullYear(),
                      new Date().getMonth() - (months > 1 ? 1 : 0),
                      1
                    )
                  }
                  onSelect={(range) => {
                    if (!range?.from) return;
                    setDraft({
                      from: startOfDay(range.from),
                      to: range.to ? startOfDay(range.to) : undefined,
                    });
                  }}
                />
              </div>

              {showPresets && !isSmallScreen ? (
                <div className="flex w-40 shrink-0 flex-col gap-1 border-s ps-3">
                  {PRESETS.map((preset) => {
                    const active = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm transition-colors",
                          active
                            ? "bg-primary/10 font-semibold text-[var(--accent-foreground)]"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Check
                          className={cn("h-3.5 w-3.5 shrink-0", !active && "opacity-0")}
                          aria-hidden
                        />
                        {t(preset.labelKey)}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 p-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  resetDraft();
                  setOpen(false);
                }}
              >
                {t("profile.cancel")}
              </Button>
              <Button
                type="button"
                onClick={commit}
                disabled={!draft.from || !draft.to}
              >
                {t("common.applyDateRange")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && hasValue ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={disabled}
          aria-label={t("common.clearDate")}
          onClick={() => onChange({})}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

type DateTimePickerProps = DatePickerProps;

/**
 * Date + time picker — value is YYYY-MM-DDTHH:mm (UTC), matching
 * toDatetimeLocalValue / fromDatetimeLocalValue.
 */
export function DateTimePicker({
  id,
  value = "",
  onChange,
  placeholder,
  disabled,
  clearable = true,
  className,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: DateTimePickerProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const selected = parseDateTimeValue(value);
  const label = placeholder ?? t("common.pickDateTime");
  const timePart = value.includes("T") ? value.slice(11, 16) : "00:00";

  const emit = (date: Date | undefined, time: string) => {
    if (!date) {
      onChange("");
      return;
    }
    const [hours, minutes] = time.split(":").map(Number);
    const next = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        hours || 0,
        minutes || 0
      )
    );
    onChange(formatDateTimeValue(next));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1">
        <Popover open={open} onOpenChange={setOpen} modal>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={ariaInvalid}
              aria-label={ariaLabel ?? label}
              className={cn(
                "h-10 min-w-0 flex-1 justify-start gap-2 px-3 font-normal tabular-nums",
                !selected && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="truncate" dir="ltr">
                {selected
                  ? `${formatDateTimeValue(selected).slice(0, 10).replaceAll("-", "/")} ${timePart}`
                  : label}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto min-w-[18.5rem] p-0" align="start" sideOffset={6}>
            <Calendar
              mode="single"
              selected={
                selected
                  ? new Date(
                      selected.getUTCFullYear(),
                      selected.getUTCMonth(),
                      selected.getUTCDate()
                    )
                  : undefined
              }
              defaultMonth={
                selected
                  ? new Date(
                      selected.getUTCFullYear(),
                      selected.getUTCMonth(),
                      selected.getUTCDate()
                    )
                  : undefined
              }
              onSelect={(date) => {
                if (!date) {
                  onChange("");
                  return;
                }
                const utcDate = new Date(
                  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
                );
                emit(utcDate, timePart || "00:00");
              }}
            />
            <div className="border-t p-3">
              <Label className="text-xs text-muted-foreground">{t("common.timeUtc")}</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <Select
                  value={value ? timePart.slice(0, 2) : undefined}
                  disabled={disabled || !value}
                  onValueChange={(hours) => {
                    if (!selected) return;
                    emit(selected, `${hours}:${timePart.slice(3, 5) || "00"}`);
                  }}
                >
                  <SelectTrigger aria-label={t("common.hours")}>
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const label = pad(hour);
                      return (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Select
                  value={value ? timePart.slice(3, 5) : undefined}
                  disabled={disabled || !value}
                  onValueChange={(minutes) => {
                    if (!selected) return;
                    emit(selected, `${timePart.slice(0, 2) || "00"}:${minutes}`);
                  }}
                >
                  <SelectTrigger aria-label={t("common.minutes")}>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 60 }, (_, minute) => {
                      const label = pad(minute);
                      return (
                        <SelectItem key={label} value={label}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {clearable && value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={disabled}
            aria-label={t("common.clearDate")}
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
