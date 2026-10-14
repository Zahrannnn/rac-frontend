import type { TranslationKey, useT } from "@/shared/i18n";

/** Translates a single field's error code into a user-facing message. */
export type FieldErrorMapper = (
  t: ReturnType<typeof useT>,
  code: string | undefined
) => string | undefined;

export type FieldErrorMapOptions = {
  /** Legacy short codes (pre-dictionary payloads) → translation keys. */
  legacyCodes: Readonly<Record<string, TranslationKey>>;
  /** Key used when the code is neither a "validation.*" key nor a legacy code. */
  fallback: TranslationKey;
};

/**
 * Builds a feature's field-error → message mapper for form field groups.
 * Zod issues already carry dictionary keys ("validation.*") and pass through;
 * legacy short codes map via `legacyCodes`; anything else gets the feature's
 * `fallback` message.
 */
export function createFieldErrorMapper({
  legacyCodes,
  fallback,
}: FieldErrorMapOptions): FieldErrorMapper {
  return (t, code) => {
    if (!code) return undefined;
    // Zod issues carry dictionary keys ("validation.*") — legacy codes still map.
    if (code.startsWith("validation.")) return t(code as TranslationKey);
    return t(legacyCodes[code] ?? fallback);
  };
}
