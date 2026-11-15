/**
 * Egyptian national ID formula (REGISTRY-GAS-SPEC §10B) — the frontend mirror of the
 * backend Domain/EgyptianNationalId. Exactly 14 digits — C YY MM DD GG SSS S X:
 * C: century (2 = 1900–1999, 3 = 2000–2099); YYMMDD: a real calendar birth date;
 * GG: an official birth-governorate code; the 13th digit's parity gives the gender
 * (odd = male, even = female); the 14th digit is a check digit (weights
 * 2,7,6,5,4,3,2,7,6,5,4,3,2 over the first 13; check = 11 − (sum mod 11), 0 when the
 * remainder is 0; a remainder of 1 would demand check 10 — invalid).
 *
 * Gender and age are NEVER entered manually — the form derives them from the ID and
 * disables the inputs.
 */

/** Official birth-governorate codes (GG positions). */
const GOVERNORATE_CODES = new Set([
  "01", "02", "03", "04",
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "23", "24", "25", "26", "27", "28", "29",
  "31", "32", "33", "34", "35", "88",
]);

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

export type EgyptianNationalIdIdentity = {
  /** Real calendar birth date (local midnight). */
  birthDate: Date;
  /** Derived gender key — "male" | "female". */
  gender: "male" | "female";
  /** Derived age in full years as of today. */
  age: number;
};

/** Null when the value is absent or fails any part of the formula. */
export function parseEgyptianNationalId(
  value: string | null | undefined
): EgyptianNationalIdIdentity | null {
  if (!value) {
    return null;
  }

  const id = value.trim();
  if (id.length !== 14 || !/^\d{14}$/.test(id)) {
    return null;
  }

  const century = id[0] === "2" ? 1900 : id[0] === "3" ? 2000 : 0;
  const year = century + Number(id.slice(1, 3));
  const month = Number(id.slice(3, 5));
  const day = Number(id.slice(5, 7));
  const birthDate = new Date(year, month - 1, day);
  if (
    century === 0 ||
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) {
    return null;
  }

  if (!GOVERNORATE_CODES.has(id.slice(7, 9))) {
    return null;
  }

  const sum = WEIGHTS.reduce((total, weight, index) => total + Number(id[index]) * weight, 0);
  const remainder = sum % 11;
  const check = remainder === 0 ? 0 : 11 - remainder;
  if (check > 9 || check !== Number(id[13])) {
    return null;
  }

  const gender = Number(id[12]) % 2 === 1 ? "male" : "female";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) {
    age--;
  }

  return { birthDate, gender, age };
}

/** Full-formula validity — the form's nationalId field validation. */
export function isValidEgyptianNationalId(value: string | null | undefined): boolean {
  return parseEgyptianNationalId(value) !== null;
}
