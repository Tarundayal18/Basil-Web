/**
 * Registration utility functions
 * Checks if a user needs to complete registration (store and subscription setup)
 */
import { apiClient } from "@/lib/api";
import { SubscriptionService } from "@/services/subscription.service";

/**
 * Checks if a user needs to complete registration
 * A user needs registration ONLY if they have no stores
 * Plan/Payment setup should only happen after trial expires (handled separately)
 * @returns Promise that resolves to true if user needs registration, false otherwise
 */
export async function checkNeedsRegistration(): Promise<boolean> {
  try {
    // Check if user has stores
    const storesResponse = await apiClient.get<
      Array<{ id: string; name: string; isActive: boolean }>
    >("/shopkeeper/stores");

    const stores = storesResponse.data || [];

    // If user has stores, they don't need registration
    // They can use the app on trial, and Plan/Payment will be shown when trial expires
    if (stores.length > 0) {
      return false;
    }

    // If no stores, user needs registration (store setup)
    return true;
  } catch (error) {
    // If there's an error checking stores, assume user needs registration
    console.error("Error checking registration status:", error);
    return true;
  }
}
