"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ar, type Dictionary, type TranslationKey } from "./ar";
import { en } from "./en";

export type Locale = "ar" | "en";

const dictionaries: Record<Locale, Dictionary> = { ar, en };
// Persisted in a cookie (readable by future server rendering) with a one-time
// migration from the old localStorage key.
const localeCookie = "rac_locale";
const localeChangeEvent = "rac:locale-change";

const locales: Record<Locale, { lang: string; dir: "rtl" | "ltr" }> = {
  ar: { lang: "ar", dir: "rtl" },
  en: { lang: "en", dir: "ltr" },
};

function persistLocale(next: Locale) {
  const { lang, dir } = locales[next];
  document.cookie = `${localeCookie}=${next}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
}

/** The stored preference — the locale cookie, falling back to the old localStorage key. */
export function storedLocale(): Locale | null {
  const cookieMatch = document.cookie.match(/(?:^|; )rac_locale=(en|ar)/);
  if (cookieMatch) {
    return cookieMatch[1] as Locale;
  }
  return window.localStorage.getItem("rac.locale") === "en" ? "en" : null;
}

type I18nContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // The server always renders the Arabic default; the persisted locale is
  // applied right after hydration (see the effect below) — initializing
  // state from storage instead would mismatch the server render (React #418)
  // and leave the page on its loading fallback forever.
  const [locale, setLocaleState] = useState<Locale>("ar");

  const setLocale = useCallback((next: Locale) => {
    persistLocale(next);
    setLocaleState(next);
    window.dispatchEvent(new Event(localeChangeEvent));
  }, []);

  // Restore the persisted preference once, right after hydration (re-runs are
  // no-ops once the stored value equals the active locale).
  useEffect(() => {
    const stored = storedLocale();
    if (stored && stored !== locale) {
      queueMicrotask(() => setLocale(stored));
    }
  }, [locale, setLocale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: locales[locale].dir,
      setLocale,
      toggleLocale: () => setLocale(locale === "ar" ? "en" : "ar"),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return value;
}

export function useT() {
  const { locale } = useI18n();
  const dictionary = dictionaries[locale];

  return useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      let text: string = dictionary[key];

      if (params) {
        for (const [name, param] of Object.entries(params)) {
          text = text.replaceAll(`{${name}}`, String(param));
        }
      }

      return text;
    },
    [dictionary]
  );
}
