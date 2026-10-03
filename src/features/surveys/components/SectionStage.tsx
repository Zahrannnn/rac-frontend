"use client";

import { useT } from "@/shared/i18n";
import type { SectionSpec } from "../schema";
import { ComplexFieldRenderer } from "./fields/FieldRenderer";

export type SectionStageProps = {
  section: SectionSpec;
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  stepErrors: string[];
  howToFill: string;
};

/** Full-section interview stage — guidance line + scrollable complex fields. */
export function SectionStage({
  section,
  answers,
  onChange,
  stepErrors,
  howToFill,
}: SectionStageProps) {
  const t = useT();

  return (
    <div className="flex min-w-0 flex-col gap-6 py-2">
      <p className="text-sm text-muted-foreground">{howToFill}</p>

      <div className="min-w-0 overflow-x-auto">
        <div className="flex flex-col gap-6">
          {section.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <ComplexFieldRenderer
                section={section}
                field={field}
                answers={answers}
                onChange={onChange}
              />
              {stepErrors.includes(field.key) ? (
                <p className="text-sm text-destructive" role="alert">
                  {t("survey.fieldRequired")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
