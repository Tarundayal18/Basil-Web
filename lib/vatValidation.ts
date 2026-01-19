/**
 * VAT ID validation utilities for Netherlands and Germany
 * Enterprise-grade VAT validation with VIES API support
 */

/**
 * Validate Dutch VAT ID format (NL123456789B01)
 * @param vatId - VAT ID to validate
 * @returns true if valid format, false otherwise
 */
export function validateNLVATID(vatId: string): boolean {
  if (!vatId || typeof vatId !== "string") return false;
  
  const trimmed = vatId.trim().toUpperCase();
  
  // Dutch VAT ID format: NL followed by 9 digits, followed by B, followed by 2 digits
  // Example: NL123456789B01
  const pattern = /^NL\d{9}B\d{2}$/;
  
  return pattern.test(trimmed);
}

/**
 * Validate German VAT ID format (DE123456789)
 * @param vatId - VAT ID to validate
 * @returns true if valid format, false otherwise
 */
export function validateDEVATID(vatId: string): boolean {
  if (!vatId || typeof vatId !== "string") return false;
  
  const trimmed = vatId.trim().toUpperCase();
  
  // German VAT ID format: DE followed by 9 digits
  // Example: DE123456789
  const pattern = /^DE\d{9}$/;
  
  return pattern.test(trimmed);
}

/**
 * Validate VAT ID format based on country
 * @param vatId - VAT ID to validate
 * @param country - Country code ('NL' | 'DE')
 * @returns true if valid format, false otherwise
 */
export function validateVATID(vatId: string, country: 'NL' | 'DE'): boolean {
  if (country === 'NL') {
    return validateNLVATID(vatId);
  } else if (country === 'DE') {
    return validateDEVATID(vatId);
  }
  return false;
}

/**
 * Validate KVK number format (8 digits)
 * @param kvkNumber - KVK number to validate
 * @returns true if valid format, false otherwise
 */
export function validateKVKNumber(kvkNumber: string): boolean {
  if (!kvkNumber || typeof kvkNumber !== "string") return false;
  
  const digits = kvkNumber.replace(/\D/g, "");
  
  // KVK number should be 8 digits
  return digits.length === 8;
}

/**
 * Format VAT ID for display
 * @param vatId - VAT ID to format
 * @returns Formatted VAT ID
 */
export function formatVATID(vatId: string): string {
  if (!vatId) return "";
  return vatId.trim().toUpperCase();
}

/**
 * Validate VAT ID via VIES API (for EU VAT IDs)
 * @param vatId - VAT ID to validate (e.g., NL123456789B01, DE123456789)
 * @returns Promise with validation result
 */
export async function validateVATIDViaVIES(vatId: string): Promise<{
  valid: boolean;
  name?: string;
  address?: string;
  error?: string;
}> {
  if (!vatId || typeof vatId !== "string") {
    return { valid: false, error: "VAT ID is required" };
  }
  
  const trimmed = vatId.trim().toUpperCase();
  
  // Extract country code and number (e.g., NL123456789B01 -> NL, 123456789B01)
  const match = trimmed.match(/^([A-Z]{2})(.+)$/);
  if (!match) {
    return { valid: false, error: "Invalid VAT ID format" };
  }
  
  const [, countryCode, vatNumber] = match;
  
  try {
    // VIES API endpoint (official EU VAT validation service)
    // Documentation: https://ec.europa.eu/taxation_customs/vies/
    // Note: VIES API format is: /ms/{countryCode}/vat/{vatNumber}
    const response = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${countryCode}/vat/${encodeURIComponent(vatNumber)}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      return { valid: false, error: "VIES service unavailable" };
    }
    
    const data = await response.json();
    
    // VIES API returns validation result
    if (data.valid === true) {
      return {
        valid: true,
        name: data.name || undefined,
        address: data.address || undefined,
      };
    } else {
      return {
        valid: false,
        error: data.error || "Invalid VAT ID",
      };
    }
  } catch (error) {
    console.warn("VIES validation failed:", error);
    return {
      valid: false,
      error: "Validation service unavailable",
    };
  }
}
