/**
 * Country Context
 * Provides country detection and API endpoint routing across the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Country,
  Language,
  detectCountry,
  getApiEndpoint,
  getRegion,
  getCurrency,
  getAvailableLanguages,
  getDefaultLanguage,
  setCountry as setCountryPreference,
  API_ENDPOINTS,
  isNL,
  isIN,
  isDE,
} from '@/lib/region-config';

interface CountryContextType {
  country: Country;
  setCountry: (country: Country) => void;
  apiEndpoint: string;
  region: string;
  currency: string;
  isNL: boolean;
  isIN: boolean;
  isDE: boolean;
  availableLanguages: Language[];
  defaultLanguage: Language;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountryState] = useState<Country>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('basil_country') as Country | null;
      if (stored && (stored === 'IN' || stored === 'NL' || stored === 'DE')) {
        return stored;
      }
    }
    return detectCountry();
  });

  // Listen for storage changes (from other tabs/windows)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = () => {
      const stored = localStorage.getItem('basil_country') as Country | null;
      if (stored && (stored === 'IN' || stored === 'NL') && stored !== country) {
        setCountryState(stored);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [country]);

  // Try to detect country from business profile on mount
  useEffect(() => {
    // This would require an API call - we'll implement it when business profile API is available
    // For now, we rely on localStorage and geo-detection
    const detectFromBusinessProfile = async () => {
      try {
        // TODO: Fetch business profile and detect country from KVK/VAT (NL) vs GSTIN (IN)
        // const profile = await fetchBusinessProfile();
        // if (profile) {
        //   const detectedCountry = profile.vatId ? 'NL' : profile.gstin ? 'IN' : null;
        //   if (detectedCountry && detectedCountry !== country) {
        //     setCountry(detectedCountry);
        //   }
        // }
      } catch (error) {
        // Silently fail - user selection takes priority anyway
        console.debug('Could not detect country from business profile:', error);
      }
    };

    // Only detect if no country is stored
    if (!localStorage.getItem('basil_country')) {
      detectFromBusinessProfile();
    }
  }, []);

  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    setCountryPreference(newCountry);
  };

  const apiEndpoint = getApiEndpoint(country);
  const region = getRegion(country);
  const currency = getCurrency(country);
  const availableLanguages = getAvailableLanguages(country);
  const defaultLanguage = getDefaultLanguage(country);

  const value: CountryContextType = {
    country,
    setCountry,
    apiEndpoint,
    region,
    currency,
    isNL: isNL(country),
    isIN: isIN(country),
    isDE: isDE(country),
    availableLanguages,
    defaultLanguage,
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

/**
 * Hook to use country context
 */
export function useCountry(): CountryContextType {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
