/**
 * Resume support (product-owner requirement 4): the last-visited section key
 * is persisted per survey so an interrupted interview reopens where it left
 * off. localStorage only — no backend changes.
 */
const KEY_PREFIX = "rac.survey.section.";

export function readLastSectionKey(surveyId: string): string | null {
  try {
    return window.localStorage.getItem(KEY_PREFIX + surveyId);
  } catch {
    return null; // private mode / storage disabled — resume falls back to consent
  }
}

export function writeLastSectionKey(surveyId: string, sectionKey: string): void {
  try {
    window.localStorage.setItem(KEY_PREFIX + surveyId, sectionKey);
  } catch {
    // non-fatal — resume simply won't work without storage
  }
}

export function clearLastSectionKey(surveyId: string): void {
  try {
    window.localStorage.removeItem(KEY_PREFIX + surveyId);
  } catch {
    // ignore
  }
}
