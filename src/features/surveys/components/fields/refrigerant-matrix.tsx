"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import { SUPPLY_DIFFICULTY_OPTIONS } from "../../schema/constants";
import { matrixColLabelKey, optionLabelKey } from "../../schema/label-keys";
import { SegmentedRow } from "./primitives";

type RefrigerantRowValue = {
  used?: string;
  supplyDifficulty?: string;
  carsPerMonthApprox?: number | null;
};

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
  value: Record<string, RefrigerantRowValue>;
  onChange: (next: Record<string, RefrigerantRowValue>) => void;
}) {
  const t = useT();

  const setRow = (row: string, patch: Partial<RefrigerantRowValue>) => {
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
