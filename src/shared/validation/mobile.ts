/**
 * Egyptian mobile parity with rac-backend `PhoneNumber.Normalize` (Features/Workshops):
 * accepts the local dialing form 01XXXXXXXXX, the international form 201XXXXXXXXX with
 * or without a leading +, and the 00201XXXXXXXXX variant — all with space, dash, dot,
 * or parenthesis separators. Storage form on the backend is 20XXXXXXXXXX.
 *
 * Schemas compose `z.string().refine(isEgyptianMobile, { message })` inline so each
 * form keeps its own i18n message key.
 */
const SEPARATORS = /[\s\-().+]/g;
const LOCAL = /^01[0125]\d{8}$/;
const INTERNATIONAL = /^201[0125]\d{8}$/;

/** Any accepted Egyptian mobile form → backend storage form, else null. */
export function normalizeEgyptianMobile(input: string): string | null {
  let digits = input.trim().replace(SEPARATORS, "");
  if (digits.length === 14 && digits.startsWith("002")) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && LOCAL.test(digits)) {
    return `2${digits}`;
  }
  return digits.length === 12 && INTERNATIONAL.test(digits) ? digits : null;
}

export function isEgyptianMobile(input: string): boolean {
  return normalizeEgyptianMobile(input) !== null;
}
