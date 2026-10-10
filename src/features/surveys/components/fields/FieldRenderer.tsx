"use client";

import { useId } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/shared/i18n";
import {
  checklistItemLabelKey,
  fieldLabelKey,
  statementLabelKey,
  type FieldSpec,
  type SectionSpec,
} from "../../schema";
import {
  CheckGroup,
  ChecklistTable,
  EquipmentChecklist,
  LikertTable,
  PhoneField,
  RadioCards,
  RangeMatrix,
  RefrigerantMatrix,
  SeasonalMatrix,
  SignaturePad,
  WorkforceMatrix,
  YesNoToggle,
} from "./inputs";

export type FieldRendererProps = {
  section: SectionSpec;
  field: FieldSpec;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  /** When true, the interview hero heading owns the label — do not render a second one. */
  hideLabel?: boolean;
  /** Photo slots (basicInfo front photo / closing docs) rendered by the wizard, not here. */
};

/** Maps one schema field to its renderer. Pure props-driven — unit-testable. */
export function FieldRenderer({
  section,
  field,
  answers,
  onChange,
  hideLabel = false,
}: FieldRendererProps) {
  const t = useT();
  const id = useId();
  const label = t(fieldLabelKey(section.key, field.key) as never);
  const value = answers[field.key] ?? null;

  switch (field.type) {
    case "enum":
      return (
        <RadioCards
          label={label}
          hideLabel={hideLabel}
          value={value === null ? null : String(value)}
          options={field.options ?? []}
          onChange={(next) => onChange(field.key, next)}
        />
      );

    case "multi":
      return (
        <CheckGroup
          label={label}
          hideLabel={hideLabel}
          values={Array.isArray(value) ? value.map(String) : []}
          options={field.options ?? []}
          onToggle={(option) => {
            const current = Array.isArray(value) ? value.map(String) : [];
            onChange(
              field.key,
              current.includes(option)
                ? current.filter((entry) => entry !== option)
                : [...current, option]
            );
          }}
        />
      );

    case "yesNo":
      return (
        <YesNoToggle
          label={label}
          hideLabel={hideLabel}
          value={value === "yes" || value === "no" ? value : null}
          onChange={(next) => onChange(field.key, next)}
        />
      );

    case "phone":
      return (
        <PhoneField
          label={label}
          hideLabel={hideLabel}
          value={typeof value === "string" ? value : ""}
          onChange={(next) => onChange(field.key, next.replace(/\s/g, ""))}
        />
      );

    case "int":
      return (
        <div className="flex flex-col gap-1">
          {hideLabel ? null : <Label htmlFor={id}>{label}</Label>}
          <Input
            id={id}
            aria-label={hideLabel ? label : undefined}
            inputMode="numeric"
            className="w-40 tabular-nums"
            value={value === null ? "" : String(value)}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^0-9-]/g, "");
              onChange(field.key, raw === "" ? null : Number(raw));
            }}
          />
          {field.helper ? (
            <p className="text-xs text-muted-foreground">
              {t(`survey.helper.${section.key}.${field.key}` as never)}
            </p>
          ) : field.min !== undefined && field.max !== undefined ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {field.min} – {field.max}
            </p>
          ) : null}
        </div>
      );

    case "text":
      return (
        <div className="flex flex-col gap-1">
          {hideLabel ? null : <Label htmlFor={id}>{label}</Label>}
          <textarea
            id={id}
            aria-label={hideLabel ? label : undefined}
            rows={2}
            className="min-h-11 rounded-md border bg-transparent px-3 py-2 text-sm"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </div>
      );

    case "email":
    case "string":
    default:
      return (
        <div className="flex flex-col gap-1">
          {hideLabel ? null : (
            <Label htmlFor={id}>
              {label}
              {field.required ? null : (
                <span className="ms-1 text-xs text-muted-foreground">({t("survey.optional")})</span>
              )}
            </Label>
          )}
          <Input
            id={id}
            aria-label={hideLabel ? label : undefined}
            type={field.type === "email" ? "email" : "text"}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(field.key, event.target.value)}
          />
        </div>
      );
  }
}

/** Matrix and checklist renderers keyed by field key (workforce section). */
export function ComplexFieldRenderer({
  section,
  field,
  answers,
  onChange,
  hideLabel = false,
}: FieldRendererProps) {
  const t = useT();
  const label = t(fieldLabelKey(section.key, field.key) as never);
  const value = (answers[field.key] ?? {}) as Record<string, never>;

  switch (field.type) {
    case "matrix3x3":
      return (
        <WorkforceMatrix
          label={label}
          hideLabel={hideLabel}
          rows={field.options ?? []}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "matrix2x5":
      return (
        <SeasonalMatrix
          label={label}
          hideLabel={hideLabel}
          rows={field.options ?? []}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "matrixDynamic":
      return (
        <RefrigerantMatrix
          label={label}
          hideLabel={hideLabel}
          rows={field.options ?? []}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "matrix3col":
      return (
        <RangeMatrix
          label={label}
          hideLabel={hideLabel}
          rows={field.options ?? []}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "likert":
      return (
        <LikertTable
          label={label}
          hideLabel={hideLabel}
          firstColLabel={t((field.firstColKey ?? "survey.likert.statementCol") as never)}
          rows={field.options ?? []}
          rowLabelFor={(row) =>
            field.statementRows
              ? t(statementLabelKey(section.key, row) as never)
              : t(checklistItemLabelKey(row) as never)
          }
          scale={field.scale ?? []}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "checklist":
      return (
        <ChecklistTable
          label={label}
          hideLabel={hideLabel}
          items={field.options ?? []}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "equipment":
      return (
        <EquipmentChecklist
          label={label}
          hideLabel={hideLabel}
          value={value as never}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "signature":
      return (
        <SignaturePad
          label={label}
          hideLabel={hideLabel}
          value={typeof answers[field.key] === "string" ? (answers[field.key] as string) : null}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case "date":
      return (
        <div className="flex flex-col gap-1">
          {hideLabel ? null : <Label>{label}</Label>}
          <DatePicker
            aria-label={hideLabel ? label : undefined}
            className="w-56"
            value={typeof answers[field.key] === "string" ? (answers[field.key] as string) : ""}
            onChange={(next) => onChange(field.key, next)}
          />
        </div>
      );
    default:
      return null;
  }
}
