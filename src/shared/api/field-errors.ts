/**
 * ProblemDetails `errors` dictionary (backend property key → messages) → form field
 * errors, translated through a per-form key map (backend property name → form field).
 * Keys without a mapping fall through under their backend name so nothing is lost.
 */
export function toFormFieldErrors(
  error: unknown,
  keyMap: Record<string, string> = {}
): Record<string, string> {
  const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
  if (!fieldErrors) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [backendKey, messages] of Object.entries(fieldErrors)) {
    const formKey = keyMap[backendKey] ?? backendKey;
    result[formKey] = messages.join(" ");
  }
  return result;
}
