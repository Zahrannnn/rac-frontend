"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { optionLabelKey } from "../../schema/label-keys";
import { SegmentedRow } from "./primitives";

export function RadioCards({
  label,
  hideLabel = false,
  value,
  options,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: string | null;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option)}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-lg border px-4 py-2.5 text-start text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 font-semibold text-[var(--accent-foreground)]"
                  : "bg-card text-foreground hover:bg-muted"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-4 shrink-0 rounded-full border-2",
                  active ? "border-primary bg-primary" : "border-muted-foreground/50"
                )}
              />
              {t(optionLabelKey(option) as never)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CheckGroup({
  label,
  hideLabel = false,
  helper,
  values,
  options,
  onToggle,
}: {
  label: string;
  hideLabel?: boolean;
  /** Optional instruction line under the label (e.g. the leakCauses multi-mark note). */
  helper?: string;
  values: readonly string[];
  options: readonly string[];
  onToggle: (option: string) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(option)}
              className={cn(
                "flex min-h-12 items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-sm transition-colors",
                active
                  ? "border-primary bg-primary/10 font-semibold text-[var(--accent-foreground)]"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50"
                )}
              >
                {active ? "✓" : ""}
              </span>
              {t(optionLabelKey(option) as never)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YesNoToggle({
  label,
  hideLabel = false,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: string | null;
  onChange: (value: "yes" | "no") => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <SegmentedRow
        name={label}
        value={value}
        options={["yes", "no"]}
        onSelect={(option) => onChange(option as "yes" | "no")}
        labelFor={(option) => t(optionLabelKey(option) as never)}
      />
    </div>
  );
}

export function PhoneField({
  label,
  hideLabel = false,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      {hideLabel ? null : <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        aria-label={hideLabel ? label : undefined}
        inputMode="tel"
        dir="ltr"
        className="tabular-nums"
        placeholder="01x xxx xxxx"
        value={value}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
          // masked 01x xxxx xxxx
          const masked = digits.replace(/^(\d{3})(\d{0,4})(\d{0,4}).*/, (_m, a, b, c) =>
            [a, b, c].filter(Boolean).join(" ")
          );
          onChange(masked || digits);
        }}
      />
    </div>
  );
}
