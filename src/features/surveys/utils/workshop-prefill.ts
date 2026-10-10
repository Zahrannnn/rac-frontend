import { GOVERNORATES, governorateSurveyKey } from "@/shared/constants/egypt";
import type { SectionAnswers } from "./answers";

/** Workshop-record fields the survey's basicInfo section can inherit. */
export type WorkshopSurveyContext = {
  code?: string;
  name?: string;
  ownerName?: string;
  /** Canonical English name as stored on the workshop ("Kafr El Sheikh"). */
  governorate?: string;
  district?: string;
  address?: string;
  /** Stored international-normalized (20XXXXXXXXXX). */
  mobile?: string;
};

/**
 * Workshop mobiles are stored international-normalized (20XXXXXXXXXX); the survey's
 * phone field (and its backend mobileFormat rule) want the local form 01XXXXXXXXX.
 * Returns null when the stored number can't be safely converted.
 */
export function toLocalMobile(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, "");
  if (/^01[0125]\d{8}$/.test(digits)) {
    return digits;
  }
  if (/^20[1][0125]\d{8}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }
  return null;
}

function fillIfEmpty(
  answers: SectionAnswers,
  key: string,
  value: unknown
): void {
  if (value === undefined || value === null || value === "") {
    return;
  }
  const current = answers[key];
  if (typeof current === "string" ? current.trim() !== "" : current != null) {
    return;
  }
  answers[key] = value;
}

/**
 * Seed the basicInfo answers already known from the workshop record so the surveyor
 * never re-types registration data. Never overwrites an existing answer — the survey
 * stays the field evidence and may correct the record.
 */
export function withWorkshopContext(
  basicInfo: SectionAnswers | undefined,
  workshop: WorkshopSurveyContext | null | undefined
): SectionAnswers {
  const next = { ...(basicInfo ?? {}) };
  if (!workshop) {
    return next;
  }

  fillIfEmpty(next, "projectCode", workshop.code);
  fillIfEmpty(next, "workshopName", workshop.name);
  fillIfEmpty(next, "ownerOrManagerName", workshop.ownerName);
  if (workshop.governorate && (GOVERNORATES as readonly string[]).includes(workshop.governorate)) {
    fillIfEmpty(next, "governorate", governorateSurveyKey(workshop.governorate));
  }
  fillIfEmpty(next, "district", workshop.district);
  fillIfEmpty(next, "address", workshop.address);
  if (workshop.mobile) {
    const local = toLocalMobile(workshop.mobile);
    if (local) {
      fillIfEmpty(next, "phoneWhatsapp", local);
    }
  }

  return next;
}
