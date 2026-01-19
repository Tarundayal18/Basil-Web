/**
 * Vehicle History Service
 * 
 * Retrieves vehicle information from previous job cards via backend API.
 * Uses backend storage (DynamoDB) for permanent persistence.
 * 
 * This allows auto-populating vehicle details when a registration number
 * is entered that was used in previous job cards.
 */

import { apiClient } from "@/lib/api";

export interface VehicleInfo {
  regNo?: string;
  make?: string;
  model?: string;
  vin?: string;
}

/**
 * Get vehicle history by registration number from backend
 * Returns the most recent vehicle details for a given registration number
 */
export async function getVehicleByRegistration(
  regNo: string
): Promise<VehicleInfo | null> {
  if (!regNo) return null;

  try {
    const response = await apiClient.get<{ vehicle: VehicleInfo | null }>(
      "/jobcards/vehicles",
      { regNo }
    );
    
    if (!response.success || !response.data) {
      // Silently fail - don't disrupt user experience if API fails
      return null;
    }

    return response.data.vehicle || null;
  } catch (error) {
    console.error("Error fetching vehicle history from backend:", error);
    // Silently fail - don't disrupt user experience
    return null;
  }
}

/**
 * @deprecated Vehicle history is now stored in job cards automatically.
 * No need to explicitly save - it's saved when job card is created.
 */
export function saveVehicleHistory(_vehicle: {
  regNo: string;
  make?: string;
  model?: string;
  year?: number;
  fuelType?: string;
  vin?: string;
  odometer?: number;
}): void {
  // No-op: Vehicle history is automatically stored in job cards
  // No need to save separately
}


