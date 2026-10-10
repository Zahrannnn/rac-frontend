"use client";

import { useT } from "@/shared/i18n";
import { cn } from "@/shared/utils/cn";
import type { FieldSpec, SectionSpec } from "../schema";
import { isFieldAnswered, isFieldValid } from "../utils/answers";
import { isSimpleField } from "../utils/field-kind";
import { ComplexFieldRenderer, FieldRenderer } from "./fields/FieldRenderer";
import { PhotoUploader } from "./PhotoUploader";

export type SectionStageProps = {
  section: SectionSpec;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  /** Field keys the surveyor edited on this visit — touched invalid fields show inline errors. */
  touchedFields: readonly string[];
  howToFill: string;
  /** Required when the section carries photo fields. */
  surveyId?: string;
  /** Full-width extras appended after the fields (closing GPS + docs photos). */
  children?: React.ReactNode;
};

/**
 * One section = one scrollable page: every field renders as a card in paper
 * order — simple controls inline, complex blocks full-width, photos via the
 * uploader. Navigation is free, so validation is inline per touched field and
 * never blocks leaving the section (the server re-checks at submit).
 */
export function SectionStage({
  section,
  answers,
  onChange,
  touchedFields,
  howToFill,
  surveyId,
  children,
}: SectionStageProps) {
  const t = useT();

  function errorFor(field: FieldSpec): string | null {
    if (!touchedFields.includes(field.key)) {
      return null;
    }
    if (isFieldValid(field, answers[field.key])) {
      return null;
    }
    if (field.type === "phone") {
      return t("survey.rule.mobileFormat");
    }
    return isFieldAnswered(answers[field.key])
      ? t("survey.fieldInvalid")
      : t("survey.fieldRequired");
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 py-2">
      <p className="text-sm text-muted-foreground">{howToFill}</p>

      <div className="min-w-0 grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {section.fields.map((field) => {
          const error = errorFor(field);
          const label = t(`survey.field.${section.key}.${field.key}` as never);

          return (
            <div
              key={field.key}
              className={cn(
                "flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-4",
                !isSimpleField(field) && "md:col-span-2"
              )}
            >
              {field.type === "photo" ? (
                surveyId ? (
                  <PhotoUploader
                    surveyId={surveyId}
                    sectionKey={section.key}
                    label={label}
                  />
                ) : null
              ) : isSimpleField(field) ? (
                <FieldRenderer
                  section={section}
                  field={field}
                  answers={answers}
                  onChange={onChange}
                />
              ) : (
                <ComplexFieldRenderer
                  section={section}
                  field={field}
                  answers={answers}
                  onChange={onChange}
                />
              )}
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {children}
    </div>
  );
}
