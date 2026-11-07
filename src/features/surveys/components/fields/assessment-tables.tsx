"use client";

import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { CHECKLIST_VALUES } from "../../schema/constants";
import { checklistItemLabelKey, optionLabelKey } from "../../schema/label-keys";
import { RadioDot, SegmentedRow, TH_COL_CENTER } from "./primitives";

/** Axis Likert table: one radio mark per row (paper: لا | الى حد ما | نعم). */
export function LikertTable({
  label,
  hideLabel = false,
  firstColLabel,
  rows,
  rowLabelFor,
  scale,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  firstColLabel: string;
  rows: readonly string[];
  rowLabelFor: (row: string) => string;
  scale: readonly string[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-2 text-start text-xs font-semibold text-muted-foreground">
              {firstColLabel}
            </th>
            {scale.map((option) => (
              <th key={option} className={TH_COL_CENTER}>
                {t(optionLabelKey(option) as never)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row} className="min-h-12">
              <th className="border p-2 text-start align-middle font-medium">
                {rowLabelFor(row)}
              </th>
              {scale.map((option) => {
                const active = value[row] === option;
                return (
                  <td key={option} className="border p-1 text-center align-middle">
                    <RadioDot
                      active={active}
                      label={`${rowLabelFor(row)} — ${t(optionLabelKey(option) as never)}`}
                      onSelect={() => onChange({ ...value, [row]: option })}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Observation checklist: available | unavailable | notVerified per item. */
export function ChecklistTable({
  label,
  hideLabel = false,
  items,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  items: readonly string[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <table className="w-full border-collapse text-sm">
        <tbody>
          {items.map((item) => (
            <tr key={item}>
              <th className="border p-2 text-start font-medium">{t(checklistItemLabelKey(item) as never)}</th>
              <td className="border p-2">
                <SegmentedRow
                  name={t(checklistItemLabelKey(item) as never)}
                  value={value[item] ?? null}
                  options={CHECKLIST_VALUES}
                  onSelect={(option) => onChange({ ...value, [item]: option })}
                  labelFor={(option) => t(optionLabelKey(option) as never)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
