/**
 * CRM Feature Flags
 * Determines which CRM features are available based on backend support
 */

import { apiClient } from "@/lib/api";

export interface CRMFeatureFlags {
  segments: boolean;
  campaigns: boolean;
  offers: boolean;
  loyalty: boolean;
  wallet: boolean;
  credit: boolean;
  reports: {
    topCustomers: boolean;
    slowMoving: boolean;
    churn: boolean;
    peakHours: boolean;
  };
  staff: boolean;
  topProducts: boolean;
  customerProfile: boolean;
  customerTimeline: boolean;
  customerPreferences: boolean;
}

// Cache for feature flags
let featureFlagsCache: CRMFeatureFlags | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a CRM endpoint is available
 */
async function checkEndpoint(endpoint: string): Promise<boolean> {
  try {
    // Note: apiClient.get doesn't support timeout option, using default behavior
    const response = await apiClient.get(endpoint);
    // If we get a successful response, the endpoint exists
    if (response.success) {
      return true;
    }
    // If we get a 404, the endpoint doesn't exist
    if (response.error?.includes("404") || response.error?.includes("Not Found")) {
      return false;
    }
    // For other errors (401, 403, etc.), assume endpoint exists but might require auth
    // This is a feature flag check, so we'll assume it exists if we get any response
    return true;
  } catch (error: any) {
    // Network errors or timeouts mean endpoint doesn't exist
    if (error?.message?.includes("timeout") || error?.message?.includes("Network")) {
      return false;
    }
    // For auth errors (401/403), assume endpoint exists (it just requires authentication)
    // This prevents false negatives when checking feature availability
    if (error?.message?.includes("401") || 
        error?.message?.includes("403") || 
        error?.message?.includes("Unauthorized") ||
        error?.message?.includes("Forbidden")) {
      return true; // Endpoint exists, just requires auth
    }
    // Other errors might mean endpoint exists but has issues
    return true;
  }
}

/**
 * Detect available CRM features by checking backend endpoints
 */
export async function detectCRMFeatures(): Promise<CRMFeatureFlags> {
  // Return cached flags if still valid
  const now = Date.now();
  if (featureFlagsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return featureFlagsCache;
  }

  // Default to all false (safe default)
  const flags: CRMFeatureFlags = {
    segments: false,
    campaigns: false,
    offers: false,
    loyalty: false,
    wallet: false,
    credit: false,
    reports: {
      topCustomers: false,
      slowMoving: false,
      churn: false,
      peakHours: false,
    },
    staff: false,
    topProducts: false,
    customerProfile: false,
    customerTimeline: false,
    customerPreferences: false,
  };

  try {
    // Check endpoints in parallel (with timeout)
    const checks = await Promise.allSettled([
      checkEndpoint("/shopkeeper/crm/segments"),
      checkEndpoint("/shopkeeper/crm/campaigns"),
      checkEndpoint("/shopkeeper/crm/offers"),
      checkEndpoint("/shopkeeper/crm/reports/top-customers"),
      checkEndpoint("/shopkeeper/crm/reports/slow-moving"),
      checkEndpoint("/shopkeeper/crm/reports/churn"),
      checkEndpoint("/shopkeeper/crm/reports/peak-hours"),
      checkEndpoint("/shopkeeper/crm/top-products"),
    ]);

    // Basic CRM features (wallet, credit, loyalty) are usually always available
    flags.wallet = true;
    flags.credit = true;
    flags.loyalty = true;
    flags.customerProfile = true;
    flags.customerTimeline = true;
    flags.customerPreferences = true;

    // Check advanced features
    if (checks[0].status === "fulfilled" && checks[0].value) flags.segments = true;
    if (checks[1].status === "fulfilled" && checks[1].value) flags.campaigns = true;
    if (checks[2].status === "fulfilled" && checks[2].value) flags.offers = true;
    if (checks[3].status === "fulfilled" && checks[3].value) flags.reports.topCustomers = true;
    if (checks[4].status === "fulfilled" && checks[4].value) flags.reports.slowMoving = true;
    if (checks[5].status === "fulfilled" && checks[5].value) flags.reports.churn = true;
    if (checks[6].status === "fulfilled" && checks[6].value) flags.reports.peakHours = true;
    if (checks[7].status === "fulfilled" && checks[7].value) flags.topProducts = true;
  } catch (error) {
    console.warn("Failed to detect CRM features, using defaults", error);
  }

  // Cache the results
  featureFlagsCache = flags;
  cacheTimestamp = now;

  return flags;
}

/**
 * Get cached feature flags (synchronous)
 */
export function getCachedCRMFeatures(): CRMFeatureFlags | null {
  return featureFlagsCache;
}

/**
 * Clear feature flags cache (force refresh on next call)
 */
export function clearCRMFeaturesCache(): void {
  featureFlagsCache = null;
  cacheTimestamp = 0;
}

/**
 * Check if a specific CRM feature is available
 */
export async function isCRMFeatureAvailable(feature: keyof CRMFeatureFlags | string): Promise<boolean> {
  const flags = await detectCRMFeatures();
  
  if (feature.includes(".")) {
    // Nested feature (e.g., "reports.topCustomers")
    const [parent, child] = feature.split(".");
    const parentFlags = flags[parent as keyof CRMFeatureFlags] as any;
    return parentFlags?.[child] === true;
  }
  
  return flags[feature as keyof CRMFeatureFlags] === true;
}
