"use client";

import { useT } from "@/shared/i18n";
import { checklistItemLabelKey, fieldLabelKey, statementLabelKey } from "../../schema/label-keys";
import type { FieldRendererProps } from "./FieldRenderer";
import { ChecklistTable, LikertTable } from "./assessment-tables";
import { RangeMatrix, SeasonalMatrix, WorkforceMatrix } from "./matrix-tables";
import { RefrigerantMatrix } from "./refrigerant-matrix";

/** Matrix and checklist renderers keyed by field type (workforce + axis sections). */
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
    default:
      return null;
  }
}
