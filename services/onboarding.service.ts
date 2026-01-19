/**
 * Onboarding Service
 * Handles tenant creation and onboarding flow
 */

import { apiClient } from "@/lib/api";

export interface OnboardingRequest {
  companyName: string;
  isMultiStore: boolean;
  country?: string;
  state?: string;
  gstin?: string;
}

export interface OnboardingResponse {
  tenant?: {
    id: string;
    tenantId: string;
    companyName: string;
    ownerId: string;
    isMultiStore: boolean;
    country: string;
    state?: string;
    gstin?: string;
    planId: string;
    subscriptionStatus: string;
    trialStartDate?: string;
    trialEndDate?: string;
  };
  tenantUser?: {
    id: string;
    tenantId: string;
    userId: string;
    role: "OWNER" | "MANAGER" | "STAFF";
    isActive: boolean;
    joinedAt: string;
  };
  message: string;
  tenantId?: string; // Included when alreadyCompleted is true
  alreadyCompleted?: boolean; // True when onboarding was already completed
}

export class OnboardingService {
  /**
   * Complete onboarding - create tenant and link shopkeeper as owner
   * Enhanced with better error handling and retry logic
   */
  static async completeOnboarding(
    data: OnboardingRequest,
    retries = 2
  ): Promise<OnboardingResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await apiClient.post<OnboardingResponse>(
          "/shopkeeper/onboarding/complete",
          data,
          {
            timeout: 30000, // 30 second timeout
          }
        );
        
        // Handle case where onboarding was already completed
        if (response.data?.alreadyCompleted || response.data?.message?.includes("already completed")) {
          // Return the already-completed response (has tenantId but no tenant/tenantUser)
          return {
            message: response.data.message || "Onboarding already completed",
            tenantId: response.data.tenantId,
            alreadyCompleted: true,
          } as OnboardingResponse;
        }
        
        // Return normal onboarding response (has tenant and tenantUser)
        if (!response.data?.tenant || !response.data?.tenantUser) {
          throw new Error("Invalid onboarding response: missing tenant or tenantUser");
        }
        
        return response.data as OnboardingResponse;
      } catch (error: any) {
        lastError = error;
        
        // Network/timeout errors - retry
        if (
          (error.message?.includes("network") ||
            error.message?.includes("timeout") ||
            error.message?.includes("fetch") ||
            error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT") &&
          attempt < retries
        ) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
          continue;
        }
        
        // Business logic errors (400, 409) - don't retry
        if (error.response?.status === 400 || error.response?.status === 409) {
          throw error;
        }
        
        // For other errors on last attempt, throw
        if (attempt === retries) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error("Failed to complete onboarding after retries");
  }

  /**
   * Check if user needs onboarding (no tenant)
   */
  static async needsOnboarding(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ tenantId?: string }>(
        "/shopkeeper/profile"
      );
      return !response.data?.tenantId;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return true;
    }
  }
}
