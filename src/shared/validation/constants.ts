/**
 * Backend-mirrored validation constants (single source for frontend rules).
 * Every value here mirrors docs/validation-matrix-backend.md / the FluentValidation
 * validators in rac-backend — do not invent values; change the backend first.
 */

// ---- Egyptian identifiers ----


/** 14 digits, century digit 2 (born 1900s) or 3 (born 2000s). */
export const EGYPT_NATIONAL_ID_REGEX = /^[23][0-9]{13}$/;

export const TELEPHONE_REGEX = /^[0-9+\-()\s]{6,16}$/;

// ---- Text length limits (mirror column limits) ----

export const MAX_WORKSHOP_NAME = 200;
export const MAX_OWNER_NAME = 128;
export const MAX_PERSON_NAME = 128;
export const MAX_ADDRESS = 400;
export const MAX_DISTRICT = 64;
export const MAX_ACTIVITIES = 500;
export const MAX_NOTES = 2000;
export const MAX_TITLE = 200;
export const MAX_VENUE = 200;
export const MAX_DESCRIPTION = 1000;
export const MAX_RECIPIENT_NAME = 128;
export const MAX_TRAINER_NAME = 128;
export const MAX_USERNAME = 64;
export const MAX_EMAIL = 254;
export const MAX_FULL_NAME = 128;

// ---- Numeric ranges ----

export const EXPERIENCE_MIN = 0;
export const EXPERIENCE_MAX = 60;
export const TECHNICIANS_MIN = 0;
export const TECHNICIANS_MAX = 1000;
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const FEEDBACK_MIN = 1;
export const FEEDBACK_MAX = 5;

// ---- GPS bounds ----

/** Physically possible coordinates — outside rejects with 400. */
export const WORLD_LATITUDE_MIN = -90;
export const WORLD_LATITUDE_MAX = 90;
export const WORLD_LONGITUDE_MIN = -180;
export const WORLD_LONGITUDE_MAX = 180;

/** Egypt bbox — outside saves, but the validation report flags gpsOutOfRange. */
export const EGYPT_LATITUDE_MIN = 21.0;
export const EGYPT_LATITUDE_MAX = 32.0;
export const EGYPT_LONGITUDE_MIN = 24.0;
export const EGYPT_LONGITUDE_MAX = 37.0;

export function isOutsideEgypt(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude < EGYPT_LATITUDE_MIN ||
    latitude > EGYPT_LATITUDE_MAX ||
    longitude < EGYPT_LONGITUDE_MIN ||
    longitude > EGYPT_LONGITUDE_MAX
  );
}
