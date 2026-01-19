/**
 * I18n Context
 * Country-aware internationalization context
 * Languages are filtered based on selected country
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCountry } from './CountryContext';
import { Language, getAvailableLanguages, getDefaultLanguage } from '@/lib/region-config';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  availableLanguages: Language[];
  t: (key: string, params?: Record<string, any>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Translation messages loaded dynamically
let messagesCache: Record<string, any> = {};

async function loadMessages(locale: Language): Promise<any> {
  if (messagesCache[locale]) {
    return messagesCache[locale];
  }

  try {
    const messages = await import(`@/locales/${locale}.json`);
    messagesCache[locale] = messages.default;
    return messages.default;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    // Fallback to English
    if (locale !== 'en') {
      return loadMessages('en');
    }
    return {};
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { country, availableLanguages: countryLanguages } = useCountry();
  const [language, setLanguageState] = useState<Language>(() => {
    // Initialize from localStorage if available and valid for country
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('basil_language') as Language | null;
      if (stored && countryLanguages.includes(stored)) {
        return stored;
      }
      // Use default language for country
      return getDefaultLanguage(country);
    }
    return getDefaultLanguage(country);
  });

  const [messages, setMessages] = useState<any>({});

  // Load messages when language changes
  useEffect(() => {
    loadMessages(language).then(setMessages);
  }, [language]);

  // Listen for storage events (language changes in other tabs)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'basil_language' && e.newValue) {
        const newLang = e.newValue as Language;
        if (countryLanguages.includes(newLang)) {
          setLanguageState(newLang);
        }
      }
    };
    
    // Also listen for custom events (for same-tab updates)
    const handleLanguageChange = () => {
      const stored = localStorage.getItem('basil_language') as Language | null;
      if (stored && countryLanguages.includes(stored) && stored !== language) {
        setLanguageState(stored);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('basil-lang-change', handleLanguageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('basil-lang-change', handleLanguageChange);
    };
  }, [countryLanguages, language]);

  // Update language if country changes (language might not be available in new country)
  useEffect(() => {
    if (!countryLanguages.includes(language)) {
      // Current language not available for this country, switch to default
      const newLang = getDefaultLanguage(country);
      setLanguageState(newLang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('basil_language', newLang);
      }
    }
  }, [country, countryLanguages, language]);

  // Translation function
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Key not found, return key itself
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Simple parameter substitution
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const setLanguage = (newLang: Language) => {
    if (countryLanguages.includes(newLang)) {
      setLanguageState(newLang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('basil_language', newLang);
        // Trigger custom event for same-tab updates (storage event only fires in other tabs)
        window.dispatchEvent(new CustomEvent('basil-lang-change'));
        // Also trigger storage event for other tabs
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'basil_language',
          newValue: newLang,
          oldValue: language,
        }));
      }
    } else {
      console.warn(`Language ${newLang} not available for country ${country}`);
    }
  };

  const value: I18nContextType = {
    language,
    setLanguage,
    availableLanguages: countryLanguages,
    t,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to use i18n context
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
