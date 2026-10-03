/** Common RAC specializations offered in the technician dropdown; "Other" reveals a free-text field. */
export const SPECIALIZATION_OPTIONS: readonly string[] = [
  "فني تبريد وتكييف",
  "فني صيانة وتصليح",
  "تقني تبريد صناعي",
  "فني ثلاجات منزلية",
  "فني وحدات تكييف مركزية",
  "فني تبريد السيارات",
  "مشرف صيانة",
  "فني كهرباء وتبريد",
];

/** Sentinel select value for "Other" — resolved to a free-text specialty by the form. */
export const SPECIALTY_OTHER_SENTINEL = "__other__";

/** Specialty seeded when the user picks "Other" but hasn't typed custom text yet. */
export const SPECIALTY_OTHER_DEFAULT = "Other";
