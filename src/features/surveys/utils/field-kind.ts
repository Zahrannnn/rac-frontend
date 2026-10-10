import type { FieldSpec, FieldType } from "../schema";

/**
 * Field-kind classification for the section-page model: every field renders on
 * its section's single scrollable page — simple controls inline, complex
 * blocks full-width, photos via the section photo uploader.
 */
const SIMPLE: ReadonlySet<FieldType> = new Set([
  "enum", "multi", "yesNo", "string", "text", "email", "phone", "int", "date",
]);

const COMPLEX: ReadonlySet<FieldType> = new Set([
  "likert", "matrix3x3", "matrix2x5", "matrixDynamic", "matrix3col", "checklist", "signature",
]);

export function isSimpleField(field: FieldSpec): boolean {
  return SIMPLE.has(field.type);
}

export function isComplexField(field: FieldSpec): boolean {
  return COMPLEX.has(field.type);
}
