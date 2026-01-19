/**
 * SettingsPage is the main settings page component.
 * It orchestrates all settings sections including business information,
 * operational settings, categories, brands, suppliers, and global configuration.
 */
"use client";

import { BusinessInformationSection } from "./settings/BusinessInformationSection";
import { OperationalSettingsSection } from "./settings/OperationalSettingsSection";
import { ProductCategoriesSection } from "./settings/ProductCategoriesSection";
import { BrandsSection } from "./settings/BrandsSection";
import { SuppliersSection } from "./settings/SuppliersSection";
import { GlobalConfigurationSection } from "./settings/GlobalConfigurationSection";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Manage global configurations for your store
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <BusinessInformationSection />
        <OperationalSettingsSection />
        <ProductCategoriesSection />
        <BrandsSection />
        <SuppliersSection />
        <GlobalConfigurationSection />
      </div>
    </div>
  );
}
