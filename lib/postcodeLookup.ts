/**
 * Postcode lookup utilities for Netherlands
 * Uses PDOK API (free, no API key needed)
 * Enterprise-grade address autocomplete
 */

/**
 * Lookup address details from Dutch postcode
 * @param postcode - Postcode in format 1234AB or 1234 AB
 * @returns Address details or null
 */
export async function lookupPostcode(postcode: string): Promise<{
  street?: string;
  city?: string;
  postcode?: string;
} | null> {
  if (!postcode) return null;
  
  // Normalize postcode: remove spaces, uppercase
  const normalized = postcode.trim().toUpperCase().replace(/\s/g, "");
  
  // Validate NL postcode format: 4 digits + 2 letters
  if (!/^\d{4}[A-Z]{2}$/.test(normalized)) return null;

  try {
    // Use PDOK API (free, no API key needed)
    // Documentation: https://api.pdok.nl/bzk/locatieserver/search/v3_1/ui/
    const response = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?fq=postcode:${normalized}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data?.response?.numFound > 0 && data?.response?.docs?.[0]) {
      const result = data.response.docs[0];
      return {
        street: result.straatnaam || undefined,
        city: result.woonplaatsnaam || undefined,
        postcode: normalized.slice(0, 4) + " " + normalized.slice(4), // Format: 1234 AB
      };
    }

    return null;
  } catch (error) {
    console.warn("Postcode lookup failed:", error);
    return null;
  }
}

/**
 * Format postcode for display (add space: 1234AB -> 1234 AB)
 * @param postcode - Postcode to format
 * @returns Formatted postcode
 */
export function formatPostcode(postcode: string): string {
  if (!postcode) return "";
  const normalized = postcode.trim().toUpperCase().replace(/\s/g, "");
  if (normalized.length === 6) {
    return normalized.slice(0, 4) + " " + normalized.slice(4);
  }
  return normalized;
}
