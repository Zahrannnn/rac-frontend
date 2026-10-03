/**
 * Backend 400 responses carry PascalCase property names in `fieldErrors`
 * ("TrainerName"); form state uses camelCase keys. Pure key-mapping — callers
 * own the error-shape extraction and their form-error types.
 */
export function mapApiFieldErrorKeys(
  fieldErrors: Record<string, string[]>
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [backendKey, messages] of Object.entries(fieldErrors)) {
    mapped[backendKey.charAt(0).toLowerCase() + backendKey.slice(1)] = messages.join(" ");
  }
  return mapped;
}
