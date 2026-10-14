"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/shared/i18n";
import { optionLabelKey } from "../../schema/label-keys";

/**
 * Long single-choice lists (the pilot governorates) render as a dropdown;
 * values remain the slugged option keys.
 */
export function EnumSelectField({
  label,
  hideLabel = false,
  value,
  options,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: unknown;
  options: readonly string[];
  onChange: (next: string) => void;
}) {
  const t = useT();
  const id = useId();
  const current = value === null || value === "" ? null : String(value);

  return (
    <div className="flex flex-col gap-1">
      {hideLabel ? null : <Label htmlFor={id}>{label}</Label>}
      <Select
        value={current ?? undefined}
        onValueChange={(next) => onChange(next)}
      >
        <SelectTrigger id={id} aria-label={hideLabel ? label : undefined}>
          {/* Children win over the placeholder once a value exists — Radix
              only shows the selected item text after the list has opened,
              so the label is passed directly (workshop prefill must show). */}
          <SelectValue placeholder={t("survey.selectOption" as never)}>
            {current ? t(optionLabelKey(current) as never) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(optionLabelKey(option) as never)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
