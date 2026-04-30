'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import type { TranslationKeys } from './locales/en';
import en from './locales/en';
import zh from './locales/zh';

// ==================== Types ====================

export type Locale = 'en' | 'zh';

const translations: Record<Locale, TranslationKeys> = { en, zh };

interface TranslationContextValue {
  t: TranslationKeys;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// ==================== Context ====================

const TranslationContext = createContext<TranslationContextValue | null>(null);

const STORAGE_KEY = 'agenthub-locale';
const DEFAULT_LOCALE: Locale = 'en';

// ==================== Provider ====================

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? loadLocaleFromStorage() ?? DEFAULT_LOCALE
  );

  // Persist locale to localStorage whenever it changes
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, newLocale);
      }
    } catch {
      // localStorage may be unavailable (e.g. SSR, private browsing)
    }
  }, []);

  // Sync locale from localStorage on mount (handles cross-tab changes)
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY && e.newValue) {
        const parsed = e.newValue as Locale;
        if (parsed === 'en' || parsed === 'zh') {
          setLocaleState(parsed);
        }
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const t = useMemo(() => translations[locale], [locale]);

  const value = useMemo(
    () => ({ t, locale, setLocale }),
    [t, locale, setLocale]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

// ==================== Hook ====================

export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error(
      'useTranslation must be used within an <I18nProvider>. ' +
        'Make sure to wrap your app with <I18nProvider> at the root level.'
    );
  }
  return ctx;
}

// ==================== Helpers ====================

function loadLocaleFromStorage(): Locale | null {
  try {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return null;
}
