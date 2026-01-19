/**
 * This file contains the settings service for managing global configuration settings.
 * It handles fetching and saving settings like tax percentage, margin percentage,
 * purchase margin percentage, and HSN code.
 */
import { apiClient } from "@/lib/api";

export interface Settings {
  taxPercentage: number;
  marginPercentage: number;
  purchaseMarginPercentage?: number;
  hsnCode?: string;
}

export interface SettingsResponse {
  id: string;
  taxPercentage: number;
  marginPercentage: number;
  purchaseMarginPercentage?: number;
  hsnCode?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SETTINGS: Settings = {
  taxPercentage: 0,
  marginPercentage: 0,
};

/**
 * Service object for managing settings operations.
 * Provides methods to get, save, and reset global configuration settings.
 */
export const settingsService = {
  /**
   * Retrieves the current settings from the server.
   * @returns A promise that resolves to the settings object
   */
  async getSettings(): Promise<Settings> {
    try {
      const response = await apiClient.get<SettingsResponse>(
        "/shopkeeper/settings"
      );
      if (response.data) {
        return {
          taxPercentage: response.data.taxPercentage ?? 0,
          marginPercentage: response.data.marginPercentage ?? 0,
          purchaseMarginPercentage: response.data.purchaseMarginPercentage,
          hsnCode: response.data.hsnCode,
        };
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }

    return DEFAULT_SETTINGS;
  },

  /**
   * Saves the provided settings to the server.
   * @param settings - Partial settings object to save
   * @returns A promise that resolves to the saved settings object
   * @throws Error if the save operation fails
   */
  async saveSettings(settings: Partial<Settings>): Promise<Settings> {
    try {
      const response = await apiClient.put<SettingsResponse>(
        "/shopkeeper/settings",
        settings
      );
      if (response.data) {
        return {
          taxPercentage: response.data.taxPercentage ?? 0,
          marginPercentage: response.data.marginPercentage ?? 0,
          purchaseMarginPercentage: response.data.purchaseMarginPercentage,
          hsnCode: response.data.hsnCode,
        };
      }
      throw new Error("Failed to save settings");
    } catch (error) {
      console.error("Error saving settings:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to save settings");
    }
  },

  /**
   * Resets settings to default values.
   * @returns A promise that resolves to the default settings
   */
  async resetSettings(): Promise<Settings> {
    return this.saveSettings(DEFAULT_SETTINGS);
  },
};
