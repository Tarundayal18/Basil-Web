import { apiClient } from "@/lib/api";

export interface StoreSettings {
  id: string;
  storeId: string;
  allowNegativeStock: boolean;
  enableBarcodeSystem: boolean;
  autoGenerateBarcode: boolean;
  enableJobCards?: boolean; // Feature flag for Job Cards (controlled by super admin)
  createdAt: string;
  updatedAt: string;
}

export const storeSettingsService = {
  async getStoreSettings(storeId?: string): Promise<StoreSettings> {
    const params: Record<string, string> = {};
    if (storeId) {
      params.storeId = storeId;
    }
    const response = await apiClient.get<StoreSettings>(
      "/shopkeeper/settings/store",
      params
    );
    if (!response.data) {
      throw new Error("Failed to get store settings");
    }
    return response.data;
  },

  async updateStoreSettings(data: {
    storeId: string;
    allowNegativeStock?: boolean;
    enableBarcodeSystem?: boolean;
    autoGenerateBarcode?: boolean;
    enableJobCards?: boolean;
  }): Promise<StoreSettings> {
    const response = await apiClient.put<StoreSettings>(
      "/shopkeeper/settings/store",
      data
    );
    if (!response.data) {
      throw new Error("Failed to update store settings");
    }
    return response.data;
  },
};
