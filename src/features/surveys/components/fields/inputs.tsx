"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useId } from "react";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import {
  checklistItemLabelKey,
  matrixColLabelKey,
  matrixRowLabelKey,
  optionLabelKey,
  CHECKLIST_VALUES,
  EQUIPMENT_ITEMS,
  EQUIPMENT_SPEC_KEYS,
  MATRIX3COL_COLS,
  SEASONAL_COLS,
  SUPPLY_DIFFICULTY_OPTIONS,
  WORKFORCE_COLS,
} from "../../schema";
import { computeWorkforceCell, type WorkforceCol, type WorkforceRow } from "../../utils/answers";

// Shared matrix-table header cells (uppercase corner / centered range-scale column).
const TH_CORNER =
  "border p-2 text-start text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const TH_COL_CENTER = "border p-2 text-center text-xs font-semibold text-muted-foreground";

/** One Likert-style radio dot cell (shared by the seasonal/range/likert tables). */
function RadioDot({
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
function SegmentedRow({
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
  values,
  options,
  onToggle,
}: {
  label: string;
  hideLabel?: boolean;
  values: readonly string[];
  options: readonly string[];
  onToggle: (option: string) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
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

/**
 * 3×3 workforce matrix. Total derives from male + female while both are known;
 * the total cell itself is directly editable (manual entry with unknown split
 * survives — see computeWorkforceCell for the exact per-edit semantics).
 */
export function WorkforceMatrix({
  label,
  hideLabel = false,
  rows,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  rows: readonly string[];
  value: Record<string, WorkforceRow>;
  onChange: (next: Record<string, WorkforceRow>) => void;
}) {
  const t = useT();

  const setCell = (row: string, column: WorkforceCol, raw: string) => {
    const numeric = raw === "" ? null : Number(raw);
    onChange({ ...value, [row]: computeWorkforceCell(value[row], column, numeric) });
  };

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={TH_CORNER} />
            {WORKFORCE_COLS.map((column) => (
              <th key={column} className={TH_CORNER}>
                {t(matrixColLabelKey(column) as never)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th className="border p-2 text-start font-medium">{t(matrixRowLabelKey(row) as never)}</th>
              {WORKFORCE_COLS.map((column) => (
                <td key={column} className={cn("border p-1", column === "total" && "bg-muted")}>
                  <Input
                    inputMode="numeric"
                    className={cn(
                      "min-h-11 w-20 tabular-nums",
                      column === "total" && "text-center font-semibold"
                    )}
                    aria-label={`${t(matrixRowLabelKey(row) as never)} — ${t(matrixColLabelKey(column) as never)}`}
                    value={value[row]?.[column] ?? ""}
                    onChange={(event) =>
                      setCell(row, column, event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 2×5 seasonal volume: one range per row. */
export function SeasonalMatrix({
  label,
  hideLabel = false,
  rows,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  rows: readonly string[];
  value: Record<string, string | null>;
  onChange: (next: Record<string, string | null>) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={TH_CORNER} />
            {SEASONAL_COLS.map((column) => (
              <th key={column} className={TH_COL_CENTER}>
                {t(matrixColLabelKey(column) as never)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th className="border p-2 text-start font-medium">{t(matrixRowLabelKey(row) as never)}</th>
              {SEASONAL_COLS.map((column) => {
                const active = value[row] === column;
                return (
                  <td key={column} className="border p-1 text-center">
                    <RadioDot
                      active={active}
                      label={`${t(matrixRowLabelKey(row) as never)} — ${t(matrixColLabelKey(column) as never)}`}
                      onSelect={() => onChange({ ...value, [row]: column })}
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

/** Dynamic refrigerant rows: used + supply difficulty + approx cars/month. */
export function RefrigerantMatrix({
  label,
  hideLabel = false,
  rows,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  rows: readonly string[];
  value: Record<string, { used?: string; supplyDifficulty?: string; carsPerMonthApprox?: number | null }>;
  onChange: (next: Record<string, { used?: string; supplyDifficulty?: string; carsPerMonthApprox?: number | null }>) => void;
}) {
  const t = useT();

  const setRow = (row: string, patch: Partial<{ used: string; supplyDifficulty: string; carsPerMonthApprox: number | null }>) => {
    onChange({ ...value, [row]: { ...value[row], ...patch } });
  };

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row} className="rounded-lg border p-3">
            <p className="font-mono text-sm font-semibold">{row}</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t(matrixColLabelKey("used") as never)}
                </span>
                <SegmentedRow
                  name={`${row} used`}
                  value={value[row]?.used ?? null}
                  options={["yes", "no"]}
                  onSelect={(option) => setRow(row, { used: option })}
                  labelFor={(option) => t(optionLabelKey(option) as never)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t(matrixColLabelKey("supplyDifficulty") as never)}
                </span>
                <SegmentedRow
                  name={`${row} supply`}
                  value={value[row]?.supplyDifficulty ?? null}
                  options={SUPPLY_DIFFICULTY_OPTIONS}
                  onSelect={(option) => setRow(row, { supplyDifficulty: option })}
                  labelFor={(option) => t(optionLabelKey(option) as never)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t(matrixColLabelKey("carsPerMonthApprox") as never)}
                </span>
                <Input
                  inputMode="numeric"
                  className="min-h-11 tabular-nums"
                  value={value[row]?.carsPerMonthApprox ?? ""}
                  onChange={(event) =>
                    setRow(row, {
                      carsPerMonthApprox:
                        event.target.value === "" ? null : Number(event.target.value.replace(/\D/g, "")),
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 3-column gas ranges: one range per row. */
export function RangeMatrix({
  label,
  hideLabel = false,
  rows,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  rows: readonly string[];
  value: Record<string, string | null>;
  onChange: (next: Record<string, string | null>) => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={TH_CORNER} />
            {MATRIX3COL_COLS.map((column) => (
              <th key={column} className={TH_COL_CENTER}>
                {t(matrixColLabelKey(column) as never)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <th className="border p-2 text-start font-mono text-xs">{row}</th>
              {MATRIX3COL_COLS.map((column) => {
                const active = value[row] === column;
                return (
                  <td key={column} className="border p-1 text-center">
                    <RadioDot
                      active={active}
                      label={`${row} — ${t(matrixColLabelKey(column) as never)}`}
                      onSelect={() => onChange({ ...value, [row]: column })}
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

/** One equipment row of the toolsEquipment block. */
export type EquipmentItemValue = {
  available?: "yes" | "no";
  condition?: "working" | "inadequate";
  powerHp?: number | null;
  capacityKg?: number | null;
  precisionG?: number | null;
  dualGas?: "yes" | "no";
};

const EQUIPMENT_SPEC_LABELS: Record<string, string> = {
  powerHp: "survey.spec.powerHp",
  capacityKg: "survey.spec.capacityKg",
  precisionG: "survey.spec.precisionG",
};

/**
 * toolsEquipment block: one card per item — availability toggle, condition,
 * then the item's spec inputs (specs render only while available = yes).
 */
export function EquipmentChecklist({
  label,
  hideLabel = false,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: Record<string, EquipmentItemValue>;
  onChange: (next: Record<string, EquipmentItemValue>) => void;
}) {
  const t = useT();

  const setItem = (item: string, patch: Partial<EquipmentItemValue>) => {
    onChange({ ...value, [item]: { ...value[item], ...patch } });
  };

  return (
    <div className="flex flex-col gap-2" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex flex-col gap-3">
        {EQUIPMENT_ITEMS.map((item) => {
          const entry = value[item] ?? {};
          const available = entry.available ?? null;
          const specs = EQUIPMENT_SPEC_KEYS[item] ?? [];
          return (
            <div key={item} className="flex flex-col gap-3 rounded-lg border p-3">
              <p className="text-sm font-semibold text-[var(--navy)]">
                {t(`survey.equipment.${item}` as never)}
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("survey.equipment.availableLabel")}
                </span>
                <SegmentedRow
                  name={`${t(`survey.equipment.${item}` as never)} — ${t("survey.equipment.availableLabel")}`}
                  value={available}
                  options={["yes", "no"]}
                  onSelect={(option) =>
                    setItem(item, option === "yes" ? { available: "yes" } : { available: "no" })
                  }
                  labelFor={(option) => t(optionLabelKey(option) as never)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {t("survey.equipment.conditionLabel")}
                </span>
                <SegmentedRow
                  name={`${t(`survey.equipment.${item}` as never)} — ${t("survey.equipment.conditionLabel")}`}
                  value={entry.condition ?? null}
                  options={["working", "inadequate"]}
                  onSelect={(option) =>
                    setItem(item, { condition: option as "working" | "inadequate" })
                  }
                  labelFor={(option) => t(`survey.cond.${option}` as never)}
                />
              </div>
              {available === "yes" && specs.length > 0 ? (
                <div className="flex flex-wrap gap-3 border-t pt-3">
                  {specs.map((spec) =>
                    spec === "dualGas" ? (
                      <div key={spec} className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("survey.spec.dualGas")}
                        </span>
                        <SegmentedRow
                          name={`${t(`survey.equipment.${item}` as never)} — ${t("survey.spec.dualGas")}`}
                          value={entry.dualGas ?? null}
                          options={["yes", "no"]}
                          onSelect={(option) => setItem(item, { dualGas: option as "yes" | "no" })}
                          labelFor={(option) => t(optionLabelKey(option) as never)}
                        />
                      </div>
                    ) : (
                      <div key={spec} className="flex w-40 flex-col gap-1">
                        <Label className="text-xs font-medium text-muted-foreground">
                          {t(EQUIPMENT_SPEC_LABELS[spec] as never)}
                        </Label>
                        <Input
                          inputMode="decimal"
                          className="min-h-11 tabular-nums"
                          aria-label={`${t(`survey.equipment.${item}` as never)} — ${t(EQUIPMENT_SPEC_LABELS[spec] as never)}`}
                          value={entry[spec as "powerHp"] ?? ""}
                          onChange={(event) => {
                            const raw = event.target.value.replace(/[^0-9.]/g, "");
                            setItem(item, {
                              [spec]: raw === "" ? null : Number(raw),
                            } as Partial<EquipmentItemValue>);
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Minimal canvas signature pad (pointer events, no dependencies). */
export function SignaturePad({
  label,
  hideLabel = false,
  value,
  onChange,
}: {
  label: string;
  hideLabel?: boolean;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (value && dirty) {
      const image = new Image();
      image.onload = () => context.drawImage(image, 0, 0);
      image.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function position(event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  return (
    <div className="flex flex-col gap-1" role="group" aria-label={hideLabel ? label : undefined}>
      {hideLabel ? null : <Label>{label}</Label>}
      <canvas
        ref={canvasRef}
        width={480}
        height={140}
        dir="ltr"
        className="w-full touch-none rounded-lg border bg-white"
        aria-label={label}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const context = canvasRef.current!.getContext("2d")!;
          const { x, y } = position(event);
          context.beginPath();
          context.moveTo(x, y);
          context.lineWidth = 2.5;
          context.lineCap = "round";
          drawing.current = true;
          setDirty(true);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) {
            return;
          }
          const context = canvasRef.current!.getContext("2d")!;
          const { x, y } = position(event);
          context.lineTo(x, y);
          context.stroke();
        }}
        onPointerUp={() => {
          if (!drawing.current) {
            return;
          }
          drawing.current = false;
          onChange(canvasRef.current!.toDataURL("image/png"));
        }}
      />
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const canvas = canvasRef.current;
            const context = canvas?.getContext("2d");
            if (canvas && context) {
              context.fillStyle = "#ffffff";
              context.fillRect(0, 0, canvas.width, canvas.height);
            }
            setDirty(false);
            onChange(null);
          }}
        >
          <Eraser data-icon="inline-start" className="h-4 w-4" />
          {t("survey.signatureClear")}
        </Button>
      </div>
    </div>
  );
}
