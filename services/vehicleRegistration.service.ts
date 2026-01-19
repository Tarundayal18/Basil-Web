/**
 * Vehicle Registration Number Parser for Indian Vehicles
 * Smart parsing of registration numbers to extract state, vehicle type, and guess make/model
 */

export interface VehicleRegistrationParseResult {
  state?: string;
  vehicleType?: "2W" | "4W"; // 2 Wheeler or 4 Wheeler
  registrationNumber: string;
  suggestedMake?: string;
  suggestedModel?: string;
  registrationYear?: number;
  fuelType?: "Petrol" | "Diesel" | "Electric" | "CNG";
}

/**
 * Indian State Code to State Name mapping
 */
const STATE_CODES: Record<string, string> = {
  "AP": "Andhra Pradesh",
  "AR": "Arunachal Pradesh",
  "AS": "Assam",
  "BR": "Bihar",
  "CG": "Chhattisgarh",
  "CH": "Chandigarh",
  "DD": "Dadra and Nagar Haveli and Daman and Diu",
  "DL": "Delhi",
  "GA": "Goa",
  "GJ": "Gujarat",
  "HR": "Haryana",
  "HP": "Himachal Pradesh",
  "JK": "Jammu and Kashmir",
  "JH": "Jharkhand",
  "KA": "Karnataka",
  "KL": "Kerala",
  "LA": "Ladakh",
  "LD": "Lakshadweep",
  "MP": "Madhya Pradesh",
  "MH": "Maharashtra",
  "MN": "Manipur",
  "ML": "Meghalaya",
  "MZ": "Mizoram",
  "NL": "Nagaland",
  "OR": "Odisha",
  "PY": "Puducherry",
  "PB": "Punjab",
  "RJ": "Rajasthan",
  "SK": "Sikkim",
  "TN": "Tamil Nadu",
  "TS": "Telangana",
  "TR": "Tripura",
  "UK": "Uttarakhand",
  "UP": "Uttar Pradesh",
  "WB": "West Bengal",
};

/**
 * Make/Model suggestions based on registration year and vehicle type
 * This is a simplified lookup. In production, use a comprehensive database
 */
const MAKE_MODEL_SUGGESTIONS: Record<
  string,
  Array<{ make: string; models: string[]; years: string }>
> = {
  "2W": [
    {
      make: "Honda",
      models: ["Activa", "Shine", "Unicorn", "Dio", "CB Shine"],
      years: "2000-2024",
    },
    {
      make: "Hero",
      models: ["Splendor", "Passion", "Xtreme", "Glamour", "Destini"],
      years: "2000-2024",
    },
    {
      make: "Bajaj",
      models: ["Pulsar", "CT", "Platina", "Avenger", "Discover"],
      years: "2000-2024",
    },
    {
      make: "TVS",
      models: ["Jupiter", "Apache", "Star City", "XL", "Radeon"],
      years: "2000-2024",
    },
    {
      make: "Yamaha",
      models: ["Fascino", "R15", "FZ", "Ray ZR", "MT"],
      years: "2000-2024",
    },
  ],
  "4W": [
    {
      make: "Maruti Suzuki",
      models: ["Alto", "Swift", "Wagon R", "Baleno", "Ertiga", "Dzire"],
      years: "2000-2024",
    },
    {
      make: "Hyundai",
      models: ["i20", "Creta", "Verna", "Grand i10", "Venue", "Alcazar"],
      years: "2000-2024",
    },
    {
      make: "Tata",
      models: ["Nexon", "Tiago", "Harrier", "Safari", "Altroz", "Punch"],
      years: "2000-2024",
    },
    {
      make: "Mahindra",
      models: ["XUV700", "Scorpio", "Thar", "Bolero", "XUV300"],
      years: "2000-2024",
    },
    {
      make: "Honda",
      models: ["City", "Amaze", "WR-V", "Elevate"],
      years: "2000-2024",
    },
    {
      make: "Toyota",
      models: ["Innova", "Fortuner", "Glanza", "Urban Cruiser"],
      years: "2000-2024",
    },
  ],
};

/**
 * Parse Indian vehicle registration number
 * Format: XX##YY#### (e.g., MH12AB1234, DL01CA1234)
 * - XX: State code (2 letters)
 * - ##: District code (2 digits)
 * - YY: Series (1-2 letters, optional)
 * - ####: Vehicle number (1-4 digits)
 */
export function parseVehicleRegistration(
  registrationNumber: string
): VehicleRegistrationParseResult | null {
  if (!registrationNumber) return null;

  // Normalize: remove spaces, convert to uppercase
  const normalized = registrationNumber.trim().toUpperCase().replace(/\s/g, "");

  // Basic validation: should be 8-13 characters
  if (normalized.length < 8 || normalized.length > 13) return null;

  // Extract state code (first 2 letters)
  const stateCode = normalized.substring(0, 2);
  const state = STATE_CODES[stateCode] || undefined;

  if (!state) {
    // Invalid state code
    return {
      registrationNumber: normalized,
    };
  }

  // Try to detect vehicle type from registration number pattern
  // This is a heuristic - actual detection would need more context
  // For now, default to 4W for cars
  let vehicleType: "2W" | "4W" | undefined = "4W";

  // Extract registration year from district code (rough estimation)
  // District codes 01-99, but year extraction is complex
  // For now, skip year extraction from registration number

  // Try to extract series (letters after district code)
  // Pattern: XX##YY#### where YY is optional series letters
  const districtCodeMatch = normalized.substring(2, 4);
  if (!/^\d{2}$/.test(districtCodeMatch)) {
    // Invalid district code
    return {
      registrationNumber: normalized,
      state,
    };
  }

  // Guess make/model based on vehicle type and common vehicles in India
  // This is a placeholder - in production, use a comprehensive database
  const suggestions = MAKE_MODEL_SUGGESTIONS[vehicleType || "4W"] || [];
  const randomSuggestion =
    suggestions[Math.floor(Math.random() * suggestions.length)];

  return {
    registrationNumber: normalized,
    state,
    vehicleType,
    suggestedMake: randomSuggestion?.make,
    suggestedModel:
      randomSuggestion?.models[
        Math.floor(Math.random() * randomSuggestion.models.length)
      ],
    fuelType: "Petrol", // Default - can be improved with better logic
  };
}

/**
 * Get vehicle make/model suggestions based on registration number parse result
 * In production, this would query a comprehensive database
 */
export function getVehicleSuggestions(
  parseResult: VehicleRegistrationParseResult
): Array<{ make: string; model: string }> {
  if (!parseResult.vehicleType) return [];

  const suggestions = MAKE_MODEL_SUGGESTIONS[parseResult.vehicleType] || [];
  const result: Array<{ make: string; model: string }> = [];

  suggestions.forEach((suggestion) => {
    suggestion.models.forEach((model) => {
      result.push({
        make: suggestion.make,
        model,
      });
    });
  });

  return result.slice(0, 10); // Limit to 10 suggestions
}

