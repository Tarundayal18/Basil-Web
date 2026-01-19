/**
 * OperationalSettingsSection component for managing store operational preferences.
 * Handles settings like negative stock, barcode system, etc.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";
import { useAnalytics } from "@/hooks/useAnalytics";
import { storeSettingsService } from "@/services/storeSettings.service";
import { useStore } from "@/contexts/StoreContext";
import { useDebounce } from "@/hooks/useDebounce";

export function OperationalSettingsSection() {
  const { selectedStore } = useStore();
  const { track, events } = useAnalytics("Operational Settings Section", false);
  const [error, setError] = useState("");

  const [operationalSettings, setOperationalSettings] = useState({
    allowNegativeStock: false,
    enableBarcodeSystem: false,
    autoGenerateBarcode: false,
  });

  const initialOperationalSettingsRef = useRef<
    typeof operationalSettings | null
  >(null);
  const isOperationalSettingsInitialLoadRef = useRef(true);

  const debouncedOperationalSettings = useDebounce(operationalSettings, 1000);

  useEffect(() => {
    if (!selectedStore) return;

    const loadSettings = async () => {
      try {
        const storeSettingsData = await storeSettingsService.getStoreSettings(
          selectedStore.id
        );
        const loadedOperationalSettings = {
          allowNegativeStock: storeSettingsData.allowNegativeStock,
          enableBarcodeSystem: storeSettingsData.enableBarcodeSystem,
          autoGenerateBarcode: storeSettingsData.autoGenerateBarcode,
        };
        initialOperationalSettingsRef.current = {
          ...loadedOperationalSettings,
        };
        isOperationalSettingsInitialLoadRef.current = true;
        setOperationalSettings(loadedOperationalSettings);
        setTimeout(() => {
          isOperationalSettingsInitialLoadRef.current = false;
        }, 1500);
      } catch (error) {
        console.error("Failed to load store settings:", error);
      }
    };

    loadSettings();
  }, [selectedStore]);

  useEffect(() => {
    if (
      isOperationalSettingsInitialLoadRef.current ||
      !selectedStore ||
      !debouncedOperationalSettings
    ) {
      return;
    }

    const initialSettings = initialOperationalSettingsRef.current;
    if (initialSettings) {
      const hasChanged =
        debouncedOperationalSettings.allowNegativeStock !==
          initialSettings.allowNegativeStock ||
        debouncedOperationalSettings.enableBarcodeSystem !==
          initialSettings.enableBarcodeSystem ||
        debouncedOperationalSettings.autoGenerateBarcode !==
          initialSettings.autoGenerateBarcode;

      if (!hasChanged) {
        return;
      }
    }

    const saveOperationalSettings = async () => {
      try {
        await storeSettingsService.updateStoreSettings({
          storeId: selectedStore.id,
          ...debouncedOperationalSettings,
        });
        track(events.SETTINGS_UPDATED, {
          section: "operational_settings",
          allow_negative_stock: debouncedOperationalSettings.allowNegativeStock,
          enable_barcode_system:
            debouncedOperationalSettings.enableBarcodeSystem,
          auto_generate_barcode:
            debouncedOperationalSettings.autoGenerateBarcode,
        });
        if (initialOperationalSettingsRef.current) {
          initialOperationalSettingsRef.current = {
            ...debouncedOperationalSettings,
          };
        }
      } catch (error) {
        console.error("Failed to auto-save operational settings:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to save operational settings"
        );
        setTimeout(() => setError(""), 3000);
      }
    };
    saveOperationalSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedOperationalSettings, selectedStore]);

  const handleOperationalSettingChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, checked } = e.target;
    setOperationalSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  if (!selectedStore) return null;

  return (
    <SectionWrapper
      title="Operational Settings"
      description="Configure store operational preferences"
      icon={SettingsIcon}
      gradientFrom="#46499e"
      gradientTo="#e1b0d1"
      iconColor="#46499e"
    >
      {error && (
        <div className="mb-4 p-3 bg-[#ed4734]/10 border-l-4 border-[#ed4734] rounded text-sm text-[#ed4734]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="allowNegativeStock"
            name="allowNegativeStock"
            checked={operationalSettings.allowNegativeStock}
            onChange={handleOperationalSettingChange}
            className="mt-1 w-4 h-4 text-[#46499e] border-gray-300 rounded focus:ring-[#46499e]"
          />
          <div className="flex-1">
            <label
              htmlFor="allowNegativeStock"
              className="block text-sm font-semibold text-gray-900"
            >
              Allow negative stock
            </label>
            <p className="text-xs text-gray-500 mt-1">
              When enabled, inventory can go negative when creating bills
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="enableBarcodeSystem"
            name="enableBarcodeSystem"
            checked={operationalSettings.enableBarcodeSystem}
            onChange={handleOperationalSettingChange}
            className="mt-1 w-4 h-4 text-[#46499e] border-gray-300 rounded focus:ring-[#46499e]"
          />
          <div className="flex-1">
            <label
              htmlFor="enableBarcodeSystem"
              className="block text-sm font-semibold text-gray-900"
            >
              Enable barcode system
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Enable barcode functionality for products
            </p>
          </div>
        </div>

        {operationalSettings.enableBarcodeSystem && (
          <div className="ml-7 flex items-start space-x-3">
            <input
              type="checkbox"
              id="autoGenerateBarcode"
              name="autoGenerateBarcode"
              checked={operationalSettings.autoGenerateBarcode}
              onChange={handleOperationalSettingChange}
              className="mt-1 w-4 h-4 text-[#46499e] border-gray-300 rounded focus:ring-[#46499e]"
            />
            <div className="flex-1">
              <label
                htmlFor="autoGenerateBarcode"
                className="block text-sm font-semibold text-gray-900"
              >
                Auto-generate barcode (EAN-13)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically generate EAN-13 barcodes for products
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Changes are automatically saved
        </p>
      </div>
    </SectionWrapper>
  );
}
