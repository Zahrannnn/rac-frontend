export type FieldType =
  | "string"
  | "text"
  | "email"
  | "phone"
  | "int"
  | "enum"
  | "multi"
  | "yesNo"
  | "matrix3x3"
  | "matrix2x5"
  | "matrixDynamic"
  | "matrix3col"
  | "likert"
  | "checklist"
  | "date"
  | "photo";

export type FieldSpec = {
  key: string;
  type: FieldType;
  required: boolean;
  options?: readonly string[];
  /** likert: answer-option keys rendered as table columns (e.g. no/somewhat/yes). */
  scale?: readonly string[];
  /** likert: rows are statements labeled `survey.statement.{section}.{row}`. */
  statementRows?: boolean;
  /** likert: table first-column header key (defaults to survey.likert.statementCol). */
  firstColKey?: string;
  min?: number;
  max?: number;
  /** i18n label key suffix — full key is `survey.field.{section}.{key}`. */
  label?: boolean;
  /** Renders helper text from `survey.helper.{section}.{key}` under the input. */
  helper?: boolean;
  /** enum only: render as a dropdown instead of radio cards (long lists, e.g. the 27 governorates). */
  ui?: "select";
};

export type SectionSpec = {
  key: string;
  /** 0-based questionnaire order (consent is the implicit step 0 handled here too). */
  order: number;
  fields: readonly FieldSpec[];
};
