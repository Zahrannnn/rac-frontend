/** Validation message keys — resolved through the i18n dictionaries (ar/en parity). */
export const VALIDATION_MESSAGES = {
  required: "validation.required",
  mobileFormat: "validation.mobileFormat",
  nationalIdFormat: "validation.nationalIdFormat",
  emailFormat: "validation.emailFormat",
  maxLength: "validation.maxLength",
  numberRange: "validation.numberRange",
  intRange: "validation.intRange",
  dateOrder: "validation.dateOrder",
  dateInvalid: "validation.dateInvalid",
  weightsSum: "validation.weightsSum",
  workshopRequired: "validation.workshopRequired",
  technicianRequired: "validation.technicianRequired",
  governorateInvalid: "validation.governorateInvalid",
  recipientPhoneInvalid: "validation.recipientPhoneInvalid",
} as const;

export type ValidationMessageKey =
  (typeof VALIDATION_MESSAGES)[keyof typeof VALIDATION_MESSAGES];
