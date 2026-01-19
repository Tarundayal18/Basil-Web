/**
 * Address lookup service for Indian cities, states, and pincodes
 */

export interface AddressLookupResult {
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
}

/**
 * Lookup city/state from pincode using free API
 * Uses https://api.postalpincode.in/ (Free, no API key needed)
 */
export async function lookupPincode(pincode: string): Promise<AddressLookupResult | null> {
  if (!pincode || pincode.length !== 6) return null;
  
  // Validate Indian pincode format (6 digits)
  if (!/^\d{6}$/.test(pincode.trim())) return null;

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode.trim()}`);
    
    if (!response.ok) return null;

    const data = await response.json();
    
    if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0]; // Take first result
      return {
        city: postOffice.District || postOffice.Name,
        state: postOffice.State,
        district: postOffice.District,
        pincode: pincode.trim(),
      };
    }

    return null;
  } catch (error) {
    console.warn("Pincode lookup failed:", error);
    return null;
  }
}

/**
 * Search cities by name (fuzzy search with Indian cities dataset)
 * Note: This is a simplified implementation. For production, use a proper city database or API
 */
export async function searchCities(query: string): Promise<Array<{ city: string; state: string }>> {
  if (!query || query.length < 2) return [];

  // This is a placeholder. In production, you'd use:
  // 1. A city database (JSON file with Indian cities)
  // 2. A backend API that searches your database
  // 3. A third-party API like Geonames, Google Places, etc.
  
  // For now, return empty array - implement with actual city database
  // You can use a static JSON file or a backend endpoint
  return [];
}

/**
 * Get state from city (using static mapping)
 * Note: This is a simplified implementation. For production, use a proper city-state database
 */
export function getStateFromCity(city: string): string | null {
  if (!city) return null;
  
  // Static mapping of major Indian cities to states
  // In production, use a comprehensive database
  const cityStateMap: Record<string, string> = {
    "mumbai": "Maharashtra",
    "pune": "Maharashtra",
    "nagpur": "Maharashtra",
    "nashik": "Maharashtra",
    "aurangabad": "Maharashtra",
    "solapur": "Maharashtra",
    "thane": "Maharashtra",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "bangalore": "Karnataka",
    "bengaluru": "Karnataka",
    "mysore": "Karnataka",
    "hubli": "Karnataka",
    "mangalore": "Karnataka",
    "hyderabad": "Telangana",
    "warangal": "Telangana",
    "chennai": "Tamil Nadu",
    "coimbatore": "Tamil Nadu",
    "madurai": "Tamil Nadu",
    "salem": "Tamil Nadu",
    "kolkata": "West Bengal",
    "howrah": "West Bengal",
    "durgapur": "West Bengal",
    "ahmedabad": "Gujarat",
    "surat": "Gujarat",
    "vadodara": "Gujarat",
    "rajkot": "Gujarat",
    "jaipur": "Rajasthan",
    "jodhpur": "Rajasthan",
    "udaipur": "Rajasthan",
    "kota": "Rajasthan",
    "lucknow": "Uttar Pradesh",
    "kanpur": "Uttar Pradesh",
    "agra": "Uttar Pradesh",
    "varanasi": "Uttar Pradesh",
    "patna": "Bihar",
    "gaya": "Bihar",
    "bhagalpur": "Bihar",
    "chandigarh": "Chandigarh",
    "amritsar": "Punjab",
    "ludhiana": "Punjab",
    "jalandhar": "Punjab",
    "bhopal": "Madhya Pradesh",
    "indore": "Madhya Pradesh",
    "gwalior": "Madhya Pradesh",
    "jabalpur": "Madhya Pradesh",
  };

  const normalizedCity = city.toLowerCase().trim();
  return cityStateMap[normalizedCity] || null;
}

