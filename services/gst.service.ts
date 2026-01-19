/**
 * GST Service
 * Fetches business details from GSTIN using various API providers
 */

import { apiClient } from "@/lib/api";

export interface GSTDetails {
  gstin: string;
  legalName?: string;
  tradeName?: string;
  status?: string;
  registrationDate?: string;
  businessType?: string;
  address?: {
    buildingName?: string;
    street?: string;
    location?: string;
    district?: string;
    state?: string;
    pincode?: string;
    fullAddress?: string;
  };
  placeOfBusiness?: Array<{
    address?: string;
    state?: string;
    pincode?: string;
  }>;
  constitutionOfBusiness?: string;
  taxpayerType?: string;
  centerJurisdiction?: string;
  stateJurisdiction?: string;
  dateOfCancellation?: string;
}

export interface GSTVerificationResponse {
  success: boolean;
  data?: GSTDetails;
  error?: string;
}

class GSTService {
  /**
   * Verify GSTIN and fetch business details
   */
  async verifyGSTIN(gstin: string): Promise<GSTVerificationResponse> {
    try {
      // Clean and validate GSTIN format
      const cleanedGSTIN = gstin.trim().toUpperCase().replace(/\s+/g, '');
      
      // Basic format validation (15 characters, alphanumeric)
      if (!/^[0-9A-Z]{15}$/.test(cleanedGSTIN)) {
        return {
          success: false,
          error: "Invalid GSTIN format. Must be 15 characters (alphanumeric).",
        };
      }

      // Call backend API endpoint for GST verification
      const response = await apiClient.get<GSTDetails>(
        `/shopkeeper/gst/verify/${cleanedGSTIN}`
      );

      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Failed to verify GSTIN. Please check the number and try again.",
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("GST verification error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify GSTIN",
      };
    }
  }

  /**
   * Extract full address from GST details
   */
  extractAddress(gstDetails: GSTDetails): string {
    if (!gstDetails.address) return "";

    const addr = gstDetails.address;
    const parts: string[] = [];

    if (addr.buildingName) parts.push(addr.buildingName);
    if (addr.street) parts.push(addr.street);
    if (addr.location) parts.push(addr.location);
    if (addr.district) parts.push(addr.district);
    if (addr.state) parts.push(addr.state);
    if (addr.pincode) parts.push(addr.pincode);

    // If full address is provided, use it
    if (addr.fullAddress) {
      return addr.fullAddress;
    }

    return parts.filter(Boolean).join(", ");
  }

  /**
   * Extract state code from GSTIN (first 2 characters)
   * GSTIN format: SSAAAAAAAGSTZ, where SS is state code
   */
  extractStateCode(gstin: string): string {
    if (gstin.length >= 2) {
      return gstin.substring(0, 2); // State code is first 2 digits
    }
    return "";
  }

  /**
   * Get state name from state code
   */
  getStateName(stateCode: string): string {
    const stateMap: Record<string, string> = {
      "01": "Jammu and Kashmir",
      "02": "Himachal Pradesh",
      "03": "Punjab",
      "04": "Chandigarh",
      "05": "Uttarakhand",
      "06": "Haryana",
      "07": "Delhi",
      "08": "Rajasthan",
      "09": "Uttar Pradesh",
      "10": "Bihar",
      "11": "Sikkim",
      "12": "Arunachal Pradesh",
      "13": "Nagaland",
      "14": "Manipur",
      "15": "Mizoram",
      "16": "Tripura",
      "17": "Meghalaya",
      "18": "Assam",
      "19": "West Bengal",
      "20": "Jharkhand",
      "21": "Odisha",
      "22": "Chhattisgarh",
      "23": "Madhya Pradesh",
      "24": "Gujarat",
      "25": "Daman and Diu",
      "26": "Dadra and Nagar Haveli",
      "27": "Maharashtra",
      "28": "Andhra Pradesh",
      "29": "Karnataka",
      "30": "Goa",
      "31": "Lakshadweep",
      "32": "Kerala",
      "33": "Tamil Nadu",
      "34": "Puducherry",
      "35": "Andaman and Nicobar Islands",
      "36": "Telangana",
      "37": "Andhra Pradesh (New)",
      "38": "Ladakh",
    };
    return stateMap[stateCode] || stateCode;
  }
}

export const gstService = new GSTService();
