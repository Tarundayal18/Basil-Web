/**
 * GlobalConfigurationSection component for managing global settings.
 * Handles default tax, margins, and HSN code configuration.
 */
"use client";

import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Percent,
  TrendingUp,
  Tag,
  Save,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { settingsService, Settings } from "@/services/settings.service";
import { useSettings } from "@/contexts/SettingsContext";

export function GlobalConfigurationSection() {
  const { track, events } = useAnalytics("Global Configuration Section", false);
  const { refreshGlobalSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [settingsData, setSettingsData] = useState<Settings>({
    taxPercentage: 0,
    marginPercentage: 0,
    purchaseMarginPercentage: undefined,
    hsnCode: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        setSettingsData(settings);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleSettingsInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    if (name === "hsnCode") {
      setSettingsData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      const numValue = value === "" ? undefined : parseFloat(value);
      setSettingsData((prev) => ({
        ...prev,
        [name]: isNaN(numValue as number) ? undefined : numValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    track(events.SETTINGS_UPDATED, {
      section: "global_configuration",
    });
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (settingsData.taxPercentage < 0 || settingsData.taxPercentage > 100) {
        throw new Error("Tax percentage must be between 0 and 100");
      }
      if (
        settingsData.marginPercentage < 0 ||
        settingsData.marginPercentage > 1000
      ) {
        throw new Error("Margin percentage must be between 0 and 1000");
      }

      await settingsService.saveSettings(settingsData);
      // Refresh the context so other components see the updated settings immediately
      await refreshGlobalSettings();
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div
        className="px-6 py-5"
        style={{
          background: "linear-gradient(to right, #46499e, #e1b0d1, #f1b02b)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Global Configuration
              </h2>
              <p className="text-white/90 text-sm mt-0.5">
                Set default values for tax, margins, and HSN code
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {(error || success) && (
          <div className="mb-4">
            {error && (
              <div className="p-3 bg-[#ed4734]/10 border-l-4 border-[#ed4734] rounded text-sm text-[#ed4734]">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-[#46499e]/10 border-l-4 border-[#46499e] rounded text-sm text-[#46499e]">
                {success}
              </div>
            )}
          </div>
        )}

        <div className="space-y-5">
          {/* Tax & HSN Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tax Percentage */}
            <div className="bg-gradient-to-br from-[#46499e]/10 to-[#46499e]/5 rounded-xl p-5 border border-[#46499e]/20 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#46499e] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Percent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="taxPercentage"
                    className="block text-sm font-bold text-gray-900 mb-1"
                  >
                    Tax Percentage (GST %)
                  </label>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Default GST rate applied to products during upload or order
                    creation
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="taxPercentage"
                  name="taxPercentage"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settingsData.taxPercentage || ""}
                  onChange={handleSettingsInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-[#46499e]/30 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm font-medium text-gray-900 transition-all shadow-sm"
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-sm font-semibold text-[#46499e]">
                    %
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Range: 0% - 100%
              </p>
            </div>

            {/* HSN Code */}
            <div className="bg-gradient-to-br from-[#e1b0d1]/10 to-[#e1b0d1]/5 rounded-xl p-5 border border-[#e1b0d1]/20 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#e1b0d1] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="hsnCode"
                    className="block text-sm font-bold text-gray-900 mb-1"
                  >
                    HSN Code
                  </label>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Default HSN code used when not specified in upload file or
                    category
                  </p>
                </div>
              </div>
              <input
                type="text"
                id="hsnCode"
                name="hsnCode"
                maxLength={50}
                value={settingsData.hsnCode || ""}
                onChange={handleSettingsInputChange}
                className="w-full px-4 py-3 bg-white border-2 border-[#e1b0d1]/30 rounded-lg focus:ring-2 focus:ring-[#e1b0d1] focus:border-[#e1b0d1] text-sm font-medium text-gray-900 transition-all shadow-sm"
                placeholder="e.g., 8517"
              />
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Max 50 characters
              </p>
            </div>
          </div>

          {/* Margin Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Margin Percentage */}
            <div className="bg-gradient-to-br from-[#46499e]/10 to-[#46499e]/5 rounded-xl p-5 border border-[#46499e]/20 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#46499e] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="marginPercentage"
                    className="block text-sm font-bold text-gray-900 mb-1"
                  >
                    Selling Margin Percentage
                  </label>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Selling price = MRP × selling margin%/100
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="marginPercentage"
                  name="marginPercentage"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settingsData.marginPercentage || ""}
                  onChange={handleSettingsInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-[#46499e]/30 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm font-medium text-gray-900 transition-all shadow-sm"
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-sm font-semibold text-[#46499e]">
                    %
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Range: 0% - 100%
              </p>
            </div>

            {/* Purchase Margin Percentage */}
            <div className="bg-gradient-to-br from-[#f1b02b]/10 to-[#f1b02b]/5 rounded-xl p-5 border border-[#f1b02b]/20 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#f1b02b] rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="purchaseMarginPercentage"
                    className="block text-sm font-bold text-gray-900 mb-1"
                  >
                    Cost Margin %
                  </label>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Cost price = MRP × cost margin%/100
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="purchaseMarginPercentage"
                  name="purchaseMarginPercentage"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settingsData.purchaseMarginPercentage || ""}
                  onChange={handleSettingsInputChange}
                  className="w-full px-4 py-3 bg-white border-2 border-[#f1b02b]/30 rounded-lg focus:ring-2 focus:ring-[#f1b02b] focus:border-[#f1b02b] text-sm font-medium text-gray-900 transition-all shadow-sm"
                  placeholder="0.00"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-sm font-semibold text-[#f1b02b]">
                    %
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 font-medium">
                Range: 0% - 100%
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#46499e] to-[#e1b0d1] text-white rounded-xl hover:from-[#46499e]/90 hover:to-[#e1b0d1]/90 font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
