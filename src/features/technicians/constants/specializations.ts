/** Qualification options (المؤهل) offered in the technician dropdown; "Other" reveals a
 *  free-text field. Stored values are the option text; legacy stored role names
 *  (فني تبريد وتكييف…) still display as free text — they are simply no longer offered. */
export const SPECIALIZATION_OPTIONS: readonly string[] = [
  "مؤهل عالي",
  "مؤهل متوسط",
  "بدون",
];

/** Sentinel select value for "Other" — resolved to a free-text specialty by the form. */
export const SPECIALTY_OTHER_SENTINEL = "__other__";

/** Specialty seeded when the user picks "Other" but hasn't typed custom text yet. */
export const SPECIALTY_OTHER_DEFAULT = "Other";
