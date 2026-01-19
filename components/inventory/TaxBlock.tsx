/**
 * This file contains the TaxBlock component for product tax-related fields.
 * Country-aware: Shows GST/HSN for India, simple VAT rate for EU
 */
"use client";

import { useState, useEffect } from "react";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useStore } from "@/contexts/StoreContext";
import { inventoryService } from "@/services/inventory.service";

interface TaxBlockProps {
  taxPercentage: string;
  hsnCode: string;
  needsBarcode: boolean;
  barcode: string;
  validationError: string;
  showBarcodeInput: boolean;
  onTaxPercentageChange: (value: string) => void;
  onHsnCodeChange: (value: string) => void;
  onNeedsBarcodeChange: (checked: boolean) => void;
  onBarcodeChange: (value: string) => void;
  onClearValidationError: () => void;
}

/**
 * TaxBlock component for displaying and editing product tax information
 */
export default function TaxBlock({
  taxPercentage,
  hsnCode,
  needsBarcode,
  barcode,
  validationError,
  showBarcodeInput,
  onTaxPercentageChange,
  onHsnCodeChange,
  onNeedsBarcodeChange,
  onBarcodeChange,
  onClearValidationError,
}: TaxBlockProps) {
  const { isIN, isNL, isDE, country } = useCountry();
  const { t } = useI18n();
  const { selectedStore } = useStore();
  const hasBarcode = barcode && barcode.trim() !== "";
  const shouldShowBarcodeInput = hasBarcode || showBarcodeInput;
  const [hsnSuggestions, setHsnSuggestions] = useState<Array<{ hsnCode: string; count: number }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // CRITICAL FIX: Auto-fetch HSN suggestions when tax percentage is entered/changed
  // This provides HSN automation based on existing products with same tax rate
  useEffect(() => {
    const fetchHSNSuggestions = async () => {
      const taxValue = parseFloat(taxPercentage);
      
      // Only fetch if tax percentage is valid and > 0, and store is selected
      if (
        !isNaN(taxValue) &&
        taxValue > 0 &&
        selectedStore?.id
      ) {
        setLoadingSuggestions(true);
        try {
          const suggestions = await inventoryService.suggestHSNCodes(
            selectedStore.id,
            taxValue
          );
          setHsnSuggestions(suggestions);
          // Auto-fill first suggestion ONLY if HSN is completely empty
          // This ensures category HSN auto-fill works first, then tax-based suggestions can fill if still empty
          // We check hsnCode from props (current value) to avoid overriding user input
          const currentHsnCode = hsnCode || "";
          if (suggestions.length > 0 && !currentHsnCode.trim()) {
            // Only auto-fill if HSN is truly empty (user hasn't typed anything and category didn't fill it)
            onHsnCodeChange(suggestions[0].hsnCode);
          }
        } catch (error) {
          console.error("Failed to fetch HSN suggestions:", error);
          setHsnSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setHsnSuggestions([]);
      }
    };

    // Debounce the API call (wait 800ms after user stops typing to avoid too many calls)
    const timeoutId = setTimeout(() => {
      fetchHSNSuggestions();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [taxPercentage, selectedStore?.id, hsnCode, onHsnCodeChange]); // Include hsnCode to check current value

  // EU VAT rates: NL (0, 9, 21%), DE (0, 7, 19%)
  const availableVatRates = isNL ? [0, 9, 21] : isDE ? [0, 7, 19] : [];
  const defaultVatRate = isNL ? 21 : isDE ? 19 : 0;

  return (
    <div className="p-4 bg-gray-50 rounded-lg order-3 md:order-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* India: GST % field */}
        {isIN && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('tax.gst')} %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={taxPercentage}
                onChange={(e) => {
                  onTaxPercentageChange(e.target.value);
                  onClearValidationError();
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('tax.hsnCode')} (HSN)
                {taxPercentage && parseFloat(taxPercentage) > 0 && (
                  <span className="text-red-500 ml-1">*</span>
                )}
                {loadingSuggestions && (
                  <span className="text-xs text-blue-600 ml-2">(Loading suggestions...)</span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={hsnCode}
                  onChange={(e) => {
                    onHsnCodeChange(e.target.value);
                    onClearValidationError();
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (hsnSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow click on dropdown
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  required={taxPercentage ? parseFloat(taxPercentage) > 0 : false}
                  placeholder={
                    hsnSuggestions.length > 0
                      ? `Suggested: ${hsnSuggestions[0].hsnCode} (or enter manually)`
                      : t('tax.hsnCodePlaceholder') || 'Enter HSN code'
                  }
                  className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    validationError && !hsnCode.trim()
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                {/* HSN Suggestions Dropdown */}
                {showSuggestions && hsnSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {hsnSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onHsnCodeChange(suggestion.hsnCode);
                          setShowSuggestions(false);
                          onClearValidationError();
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{suggestion.hsnCode}</div>
                        <div className="text-xs text-gray-500">
                          Used in {suggestion.count} product{suggestion.count !== 1 ? 's' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {hsnSuggestions.length > 0 && !hsnCode.trim() && (
                <p className="mt-1 text-xs text-blue-600">
                  💡 {hsnSuggestions.length} HSN code{hsnSuggestions.length !== 1 ? 's' : ''} found for {taxPercentage}% GST
                </p>
              )}
            </div>
          </>
        )}

        {/* EU: Simple VAT Rate field (no HSN code) */}
        {(isNL || isDE) && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('tax.vatRate')} ({country === 'NL' ? '0%, 9%, 21%' : '0%, 7%, 19%'})
            </label>
            <select
              value={taxPercentage || defaultVatRate.toString()}
              onChange={(e) => {
                onTaxPercentageChange(e.target.value);
                onClearValidationError();
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            >
              {availableVatRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}% {rate === 0 ? t('tax.zeroRated') || 'Zero rated' : rate === (isNL ? 9 : 7) ? t('tax.reducedRate') || 'Reduced' : t('tax.standardRate') || 'Standard'}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {t('tax.vatRateDescription') || 'Select VAT rate for this product'}
            </p>
          </div>
        )}

        <div>
          {shouldShowBarcodeInput ? (
            <>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Barcode
                <span className="text-gray-500 ml-1 text-xs">(Replace/Update)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => onBarcodeChange(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enter or scan barcode"
                />
                <button
                  type="button"
                  onClick={() => onBarcodeChange("")}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50 transition-all"
                  title="Clear/Remove barcode"
                >
                  Clear
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Replace with new barcode or clear to remove
              </p>
            </>
          ) : (
            <>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                &nbsp;
              </label>
              <div className="flex items-center h-[34px] pl-2">
                <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsBarcode}
                    onChange={(e) => onNeedsBarcodeChange(e.target.checked)}
                    className="mr-2 w-4 h-4"
                  />
                  Generate Barcode
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
