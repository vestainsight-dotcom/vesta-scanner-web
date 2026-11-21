"use client";

// Minimal i18n: a React context holding the locale. The server HTML is always
// rendered in DEFAULT_LOCALE; the browser switches right after hydration to the
// ?lang= parameter or the remembered choice (per-browser convenience only).

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, MESSAGES, isLocale, type Locale, type Messages } from "./messages";

const STORAGE_KEY = "vesta-scanner-web:locale";

interface I18n {
  locale: Locale;
  m: Messages;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<I18n>({ locale: DEFAULT_LOCALE, m: MESSAGES[DEFAULT_LOCALE], setLocale: () => {} });

function readStored(): Locale | null {
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(q)) return q;
    const s = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(s) ? s : null;
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = readStored();
    if (stored && stored !== DEFAULT_LOCALE) {
      const t = setTimeout(() => setLocaleState(stored), 0);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    // after Next.js has applied the (default-locale) metadata title
    const t = setTimeout(() => (document.title = MESSAGES[locale].meta.title), 50);
    return () => clearTimeout(t);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // storage unavailable (private mode): the choice lasts for this page only
    }
  }, []);

  return <Ctx.Provider value={{ locale, m: MESSAGES[locale], setLocale }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
