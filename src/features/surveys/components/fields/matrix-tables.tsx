"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import { MATRIX3COL_COLS, SEASONAL_COLS, WORKFORCE_COLS } from "../../schema/constants";
import { matrixColLabelKey, matrixRowLabelKey } from "../../schema/label-keys";
import { computeWorkforceCell, type WorkforceCol, type WorkforceRow } from "../../utils/answers";
import { RadioDot, TH_COL_CENTER, TH_CORNER } from "./primitives";

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
