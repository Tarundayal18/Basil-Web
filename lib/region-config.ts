/**
 * Multi-Region Configuration
 * Handles country detection and API endpoint routing based on domain
 * Domain-based routing:
 * - basil.ind.in → India (IN) - GST, Mumbai region
 * - basilsoftware.eu → Netherlands/Germany (NL/DE) - VAT, Frankfurt region
 */

export type Country = 'IN' | 'NL' | 'DE';
export type Region = 'ap-south-1' | 'eu-central-1';

/**
 * Domain configuration
 * Maps domains to countries
 */
export const DOMAIN_COUNTRY_MAP: Record<string, Country> = {
  'basil.ind.in': 'IN',
  'www.basil.ind.in': 'IN',
  'basilsoftware.eu': 'NL', // Default to NL, but can be DE based on user selection or business profile
  'www.basilsoftware.eu': 'NL',
  'basilsoftware.de': 'DE', // Optional: separate German domain
  'www.basilsoftware.de': 'DE',
};

/**
 * Get country from domain (primary detection method)
 * Domain-based routing ensures correct country from the start
 */
export function getCountryFromDomain(): Country | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();

  // Check exact match first
  if (DOMAIN_COUNTRY_MAP[hostname]) {
    return DOMAIN_COUNTRY_MAP[hostname];
  }

  // Check domain patterns (handles subdomains, staging, etc.)
  if (hostname.includes('basil.ind.in')) {
    return 'IN';
  }
  
  if (hostname.includes('basilsoftware.eu') || hostname.includes('basilsoftware.de')) {
    // For EU domain, default to NL but allow override via localStorage/business profile
    // In production, you might want to detect based on business profile or subdomain
    const stored = localStorage.getItem('basil_country') as Country | null;
    if (stored === 'DE') {
      return 'DE';
    }
    return 'NL'; // Default to NL for EU domain
  }

  // Development/localhost fallback
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    // Check localStorage for manual override during development
    const stored = localStorage.getItem('basil_country') as Country | null;
    if (stored && (stored === 'IN' || stored === 'NL' || stored === 'DE')) {
      return stored;
    }
    return 'IN'; // Default to IN for localhost
  }

  return null;
}

/**
 * API Endpoints for each region
 * For India (IN), we now use split stacks (admin, shopkeeper, billing, jobcard)
 * For other regions, we use single unified endpoint
 */
export const API_ENDPOINTS: Record<Country, string> = {
  IN: process.env.NEXT_PUBLIC_API_URL_INDIA || 
      process.env.NEXT_PUBLIC_SHOPKEEPER_API_URL || // Default to shopkeeper for backward compatibility
      process.env.NEXT_PUBLIC_API_URL || 
      'http://localhost:8000/api/v1',
  NL: process.env.NEXT_PUBLIC_API_URL_NL || 
      'http://localhost:8001/api/v1',
  DE: process.env.NEXT_PUBLIC_API_URL_DE || 
      process.env.NEXT_PUBLIC_API_URL_NL || // Germany can share Frankfurt region with NL
      'http://localhost:8001/api/v1',
} as const;

/**
 * Region mapping for each country
 */
export const COUNTRY_REGIONS: Record<Country, Region> = {
  IN: 'ap-south-1',
  NL: 'eu-central-1',
  DE: 'eu-central-1', // Germany also uses Frankfurt region (EU)
} as const;

/**
 * Currency mapping for each country
 */
export const COUNTRY_CURRENCIES: Record<Country, string> = {
  IN: 'INR',
  NL: 'EUR',
  DE: 'EUR',
} as const;

/**
 * Available languages for each country
 */
export type Language = 'en' | 'hi' | 'nl' | 'de';

export const COUNTRY_LANGUAGES: Record<Country, Language[]> = {
  IN: ['en', 'hi'],      // India: English, Hindi
  NL: ['nl', 'en'],      // Netherlands: Dutch, English
  DE: ['de', 'en'],      // Germany: German, English
} as const;

/**
 * Detect country from various sources
 * Priority: Domain (HIGHEST - ensures correct routing) > localStorage > Business Profile > Geo-Location > Default
 * 
 * Domain-based routing is the PRIMARY method:
 * - basil.ind.in → IN (always India, GST complexity)
 * - basilsoftware.eu → NL/DE (always EU, simple VAT, no GST complexity)
 */
export function detectCountry(): Country {
  // 1. PRIMARY: Domain-based detection (highest priority - ensures correct routing)
  // Domain determines the entire experience: India gets GST, EU gets simple VAT
  const domainCountry = getCountryFromDomain();
  if (domainCountry) {
    // Store domain-based country in localStorage for consistency
    if (typeof window !== 'undefined') {
      localStorage.setItem('basil_country', domainCountry);
    }
    return domainCountry;
  }

  // 2. FALLBACK: Check localStorage (for development/testing or manual override)
  if (typeof window !== 'undefined') {
    const storedCountry = localStorage.getItem('basil_country') as Country | null;
    if (storedCountry && (storedCountry === 'IN' || storedCountry === 'NL' || storedCountry === 'DE')) {
      return storedCountry;
    }
  }

  // 3. FALLBACK: Geo-location detection (optional, can be enabled)
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_GEO_DETECTION === 'true') {
    const detected = detectCountryFromGeoLocation();
    if (detected) {
      return detected;
    }
  }

  // 4. DEFAULT: India (fallback for localhost/development)
  return 'IN';
}

/**
 * Detect country from geo-location (IP-based)
 * This is a simple implementation - you may want to use a service like ipapi.co
 */
function detectCountryFromGeoLocation(): Country | null {
  // Simple timezone-based detection (not very accurate)
  if (typeof window !== 'undefined') {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // German timezone → DE
    if (timezone.startsWith('Europe/Berlin') || timezone.startsWith('Europe/Berlin')) {
      return 'DE';
    }
    
    // Dutch timezone → NL
    if (timezone.startsWith('Europe/Amsterdam')) {
      return 'NL';
    }
    
    // Other European timezones → Default to NL (can be refined)
    if (timezone.startsWith('Europe/')) {
      return 'NL';
    }
    
    // Indian timezone → IN
    if (timezone === 'Asia/Kolkata' || timezone === 'Asia/Calcutta') {
      return 'IN';
    }
  }
  
  return null;
}

/**
 * Get API endpoint for a given country
 */
export function getApiEndpoint(country?: Country): string {
  const detectedCountry = country || detectCountry();
  return API_ENDPOINTS[detectedCountry] || API_ENDPOINTS.IN;
}

/**
 * Get region for a given country
 */
export function getRegion(country?: Country): Region {
  const detectedCountry = country || detectCountry();
  return COUNTRY_REGIONS[detectedCountry] || COUNTRY_REGIONS.IN;
}

/**
 * Get currency symbol for a given country
 * Returns: '₹' for India (INR), '€' for EU (EUR)
 */
export function getCurrencySymbol(country?: Country): string {
  const countryCode = country || detectCountry();
  switch (countryCode) {
    case 'IN':
      return '₹'; // INR
    case 'NL':
    case 'DE':
      return '€'; // EUR
    default:
      return '₹'; // Default to INR
  }
}

/**
 * Format amount with country-aware currency symbol
 * @param amount - Amount to format
 * @param country - Country code (optional, auto-detected if not provided)
 * @returns Formatted amount string (e.g., "₹1,234.56" or "€1,234.56")
 */
export function formatCurrency(amount: number, country?: Country): string {
  const symbol = getCurrencySymbol(country);
  const formatted = new Intl.NumberFormat(country === 'IN' ? 'en-IN' : 'en-EU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

/**
 * Get currency for a given country
 */
export function getCurrency(country?: Country): string {
  const detectedCountry = country || detectCountry();
  return COUNTRY_CURRENCIES[detectedCountry] || COUNTRY_CURRENCIES.IN;
}

/**
 * Set country preference (stores in localStorage)
 */
export function setCountry(country: Country): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('basil_country', country);
    // Trigger storage event for other tabs/windows
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Clear country preference
 */
export function clearCountry(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('basil_country');
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Check if country is NL (Netherlands)
 */
export function isNL(country?: Country): boolean {
  const detectedCountry = country || detectCountry();
  return detectedCountry === 'NL';
}

/**
 * Check if country is IN (India)
 */
export function isIN(country?: Country): boolean {
  const detectedCountry = country || detectCountry();
  return detectedCountry === 'IN';
}

/**
 * Check if country is DE (Germany)
 */
export function isDE(country?: Country): boolean {
  const detectedCountry = country || detectCountry();
  return detectedCountry === 'DE';
}

/**
 * Get display name for country
 */
export function getCountryName(country: Country, locale: string = 'en'): string {
  switch (locale) {
    case 'nl':
      return country === 'NL' ? 'Nederland' : country === 'DE' ? 'Duitsland' : 'India';
    case 'de':
      return country === 'DE' ? 'Deutschland' : country === 'NL' ? 'Niederlande' : 'Indien';
    case 'hi':
      return country === 'IN' ? 'भारत' : country === 'DE' ? 'जर्मनी' : 'नीदरलैंड';
    default: // 'en'
      return country === 'IN' ? 'India' : country === 'NL' ? 'Netherlands' : 'Germany';
  }
}

/**
 * Get available languages for a country
 */
export function getAvailableLanguages(country?: Country): Language[] {
  const detectedCountry = country || detectCountry();
  return COUNTRY_LANGUAGES[detectedCountry] || ['en'];
}

/**
 * Get default language for a country
 */
export function getDefaultLanguage(country?: Country): Language {
  const languages = getAvailableLanguages(country);
  return languages[0]; // First language is default
}
