/**
 * Business Profile Service
 * Enterprise-grade business profile management with country-specific fields
 */

import { apiClient } from "@/lib/api";

export interface BusinessProfile {
  profileId: string;
  ownerId: string;
  businessName?: string;
  address: {
    street?: string;
    postcode?: string;
    city?: string;
    state?: string; // For India
    country: string;
  };
  // India-specific fields
  gstin?: string;
  pan?: string;
  // NL/DE-specific fields
  kvkNumber?: string; // Netherlands only
  vatNumber?: string; // EU (BTW ID)
  iban?: string;
  bic?: string;
  // Common fields
  email?: string;
  phone?: string;
  logoUrl?: string;
  // Invoice settings
  defaultVatMode?: "normal" | "reverse_charge" | "kor" | "intra_eu_b2b" | "export"; // For NL
  defaultTaxMode?: "INTRA" | "INTER"; // For India
  defaultInvoiceLanguage?: "NL" | "EN" | "HI" | "EN-IN";
  invoiceFooterText?: string;
  invoiceNumberFormat?: string; // e.g., "INV-{YEAR}-{NUMBER}" or "INV-{NUMBER}"
  invoiceNumberReset?: "yearly" | "continuous";
  invoiceNumberStart?: number; // India: default starting number per store (migration support)
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessProfileRequest {
  businessName?: string;
  address: {
    street?: string;
    postcode?: string;
    city?: string;
    state?: string;
    country: string;
  };
  gstin?: string; // India only
  pan?: string; // India only
  kvkNumber?: string; // Netherlands only
  vatNumber?: string; // EU
  iban?: string;
  bic?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  defaultVatMode?: "normal" | "reverse_charge" | "kor" | "intra_eu_b2b" | "export";
  defaultTaxMode?: "INTRA" | "INTER";
  defaultInvoiceLanguage?: "NL" | "EN" | "HI" | "EN-IN";
  invoiceFooterText?: string;
  invoiceNumberFormat?: string;
  invoiceNumberReset?: "yearly" | "continuous";
  invoiceNumberStart?: number;
}

class BusinessProfileService {
  /**
   * Get business profile
   */
  async getBusinessProfile(): Promise<BusinessProfile | null> {
    const response = await apiClient.get<{ profile: BusinessProfile }>(
      `/shopkeeper/business-profile`
    );
    return response.data?.profile || null;
  }

  /**
   * Create or update business profile
   */
  async saveBusinessProfile(
    data: CreateBusinessProfileRequest
  ): Promise<BusinessProfile> {
    const response = await apiClient.post<{ profile: BusinessProfile }>(
      `/shopkeeper/business-profile`,
      data
    );
    if (!response.success || !response.data?.profile) {
      throw new Error(response.error || "Failed to save business profile");
    }
    return response.data.profile;
  }

  /**
   * Update business profile
   */
  async updateBusinessProfile(
    data: Partial<CreateBusinessProfileRequest>
  ): Promise<BusinessProfile> {
    const response = await apiClient.put<{ profile: BusinessProfile }>(
      `/shopkeeper/business-profile`,
      data
    );
    if (!response.success || !response.data?.profile) {
      throw new Error(response.error || "Failed to update business profile");
    }
    return response.data.profile;
  }
}

export const businessProfileService = new BusinessProfileService();
