"use client";

import { useT } from "@/shared/i18n";
import { fieldLabelKey, type FieldSpec, type SectionSpec } from "../schema";
import { isComplexField } from "../utils/interview-nav";
import { ComplexFieldRenderer, FieldRenderer } from "./fields/FieldRenderer";
import { PhotoUploader } from "./PhotoUploader";

export type QuestionStageProps = {
  section: SectionSpec;
  field: FieldSpec;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  /** Required when `field.type === "photo"`. */
  surveyId?: string;
};

/** Single-field interview stage — hero label, control, inline error. */
export function QuestionStage({
  section,
  field,
  answers,
  onChange,
  error,
  surveyId,
}: QuestionStageProps) {
  const t = useT();
  const label = t(fieldLabelKey(section.key, field.key) as never);
  // Mixed sections (workforce / closing) walk complex + date fields one-at-a-time.
  const useComplex = isComplexField(field) || field.type === "date";

  return (
    <div className="flex flex-col gap-6 py-2">
      <h3 className="text-lg font-semibold leading-snug text-[var(--navy)]">{label}</h3>

      {field.type === "photo" ? (
        surveyId ? (
          <PhotoUploader
            surveyId={surveyId}
            sectionKey={section.key}
            label={label}
            hideLabel
          />
        ) : null
      ) : useComplex ? (
        <ComplexFieldRenderer
          section={section}
          field={field}
          answers={answers}
          onChange={onChange}
          hideLabel
        />
      ) : (
        <FieldRenderer
          section={section}
          field={field}
          answers={answers}
          onChange={onChange}
          hideLabel
        />
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
