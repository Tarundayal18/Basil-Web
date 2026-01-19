/**
 * This file contains the SettingsContext provider for managing
 * global settings and category rates across the application.
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { settingsService } from "@/services/settings.service";
import { inventoryService } from "@/services/inventory.service";
import { useStore } from "./StoreContext";

interface GlobalSettings {
  taxPercentage: number;
  marginPercentage: number;
  purchaseMarginPercentage?: number;
  hsnCode?: string;
}

interface CategoryRates {
  gstRate?: number;
  hsnCode?: string;
  marginPercentage?: number;
  purchaseMarginPercentage?: number;
}

interface SettingsContextType {
  globalSettings: GlobalSettings;
  categoryRates: Map<string, CategoryRates>; // categoryId -> rates
  loading: boolean;
  refreshGlobalSettings: () => Promise<void>;
  getCategoryRates: (categoryId: string) => Promise<CategoryRates | null>;
  clearCategoryRates: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

/**
 * Provider component for settings context
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { selectedStore } = useStore();
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    taxPercentage: 0,
    marginPercentage: 0,
  });
  const [categoryRates, setCategoryRates] = useState<
    Map<string, CategoryRates>
  >(new Map());
  const [loading, setLoading] = useState(true);

  /**
   * Loads global settings from the server
   */
  const refreshGlobalSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setGlobalSettings({
        taxPercentage: settings.taxPercentage || 0,
        marginPercentage: settings.marginPercentage || 0,
        purchaseMarginPercentage: settings.purchaseMarginPercentage,
        hsnCode: settings.hsnCode,
      });
    } catch (error) {
      console.error("Failed to load global settings:", error);
    }
  };

  /**
   * Gets category rates for a specific category
   * @param categoryId - The category ID
   * @returns Category rates or null if not found
   */
  const getCategoryRates = async (
    categoryId: string
  ): Promise<CategoryRates | null> => {
    if (!categoryId || !selectedStore?.id) {
      return null;
    }

    // Check cache first
    if (categoryRates.has(categoryId)) {
      return categoryRates.get(categoryId) || null;
    }

    try {
      const categories = await inventoryService.getCategories(selectedStore.id);
      const category = categories.find((cat) => cat.id === categoryId);
      if (category) {
        const rates: CategoryRates = {
          gstRate: category.gstRate,
          hsnCode: category.hsnCode,
          marginPercentage: category.marginPercentage,
          purchaseMarginPercentage: category.purchaseMarginPercentage,
        };
        setCategoryRates((prev) => new Map(prev.set(categoryId, rates)));
        return rates;
      }
    } catch (error) {
      console.error("Failed to load category rates:", error);
    }

    return null;
  };

  /**
   * Clears all cached category rates
   */
  const clearCategoryRates = () => {
    setCategoryRates(new Map());
  };

  // Load global settings on mount and when store changes
  useEffect(() => {
    if (selectedStore?.id) {
      setLoading(true);
      refreshGlobalSettings().finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStore?.id]);

  return (
    <SettingsContext.Provider
      value={{
        globalSettings,
        categoryRates,
        loading,
        refreshGlobalSettings,
        getCategoryRates,
        clearCategoryRates,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to use settings context
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
