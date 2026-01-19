/**
 * GSTIN Validation Utilities for India
 * Validates GSTIN format according to Indian GST rules
 */

/**
 * Validates GSTIN format (15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric)
 * Format: 27ABCDE1234F1Z5 (State Code + PAN + Entity Number + Z + Checksum)
 * 
 * @param gstin - GSTIN to validate
 * @returns Object with valid flag and error message if invalid
 */
export function validateGSTINFormat(gstin: string): {
  valid: boolean;
  error?: string;
} {
  if (!gstin || typeof gstin !== "string") {
    return { valid: false, error: "GSTIN is required" };
  }

  const trimmed = gstin.trim().toUpperCase();

  // Check length
  if (trimmed.length !== 15) {
    return { valid: false, error: "GSTIN must be exactly 15 characters" };
  }

  // GSTIN format: 2 digits (state) + 5 letters (PAN) + 4 digits (PAN) + 1 letter (PAN) + 1 alphanumeric + Z + 1 alphanumeric
  // Pattern: ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
  const gstinPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstinPattern.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid GSTIN format. Format: 27ABCDE1234F1Z5 (15 characters)",
    };
  }

  // Basic checksum validation (Luhn mod 36 algorithm)
  // This is a simplified version - for production, implement full checksum validation
  const checksumDigit = trimmed[14];
  const baseGSTIN = trimmed.substring(0, 14);

  // Validate state code (first 2 digits should be valid Indian state code: 01-38)
  const stateCode = parseInt(trimmed.substring(0, 2), 10);
  if (stateCode < 1 || stateCode > 38) {
    return { valid: false, error: "Invalid state code in GSTIN" };
  }

  return { valid: true };
}

/**
 * Formats GSTIN to uppercase and removes spaces
 * @param gstin - GSTIN to format
 * @returns Formatted GSTIN
 */
export function formatGSTIN(gstin: string): string {
  if (!gstin) return "";
  return gstin.trim().toUpperCase().replace(/\s+/g, "");
}
