/**
 * Language Selector Component
 * Country-aware language selector - shows only languages available for selected country
 */

'use client';

import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Language, getCountryName } from '@/lib/region-config';

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  hi: 'हिंदी',
  nl: 'Nederlands',
  de: 'Deutsch',
};

export function LanguageSelector() {
  const { language, setLanguage, availableLanguages } = useI18n();

  const handleLanguageChange = (newLang: Language) => {
    if (newLang !== language && availableLanguages.includes(newLang)) {
      setLanguage(newLang);
      // Optionally reload to apply translations (or use context for instant updates)
      // window.location.reload();
    }
  };

  if (availableLanguages.length <= 1) {
    // Only one language available, don't show selector
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Language:</label>
      <div className="flex gap-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              language === lang
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {LANGUAGE_NAMES[lang]}
          </button>
        ))}
      </div>
    </div>
  );
}
