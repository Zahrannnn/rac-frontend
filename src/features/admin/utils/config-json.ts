/** Strict JSON-object check shared by the survey-rule dialogs for config drafts. */
export function isJsonObject(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
  } catch {
    return false;
  }
}
