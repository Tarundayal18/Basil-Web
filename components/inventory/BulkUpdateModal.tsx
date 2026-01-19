/**
 * This file contains the BulkUpdateModal component which allows users to bulk update
 * product fields (MRP, selling discount, buying discount, GST) for selected categories.
 */

"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { inventoryService } from "@/services/inventory.service";
import SearchableMultiSelect from "./SearchableMultiSelect";

interface BulkUpdateModalProps {
  onClose: () => void;
  onPreview: (updateConfig: {
    categoryIds: string[];
    field:
      | "mrp"
      | "marginPercentage"
      | "purchaseMarginPercentage"
      | "taxPercentage";
    changeType: "increase" | "decrease" | "set";
    value: number;
  }) => void;
}

/**
 * BulkUpdateModal allows users to configure bulk updates for products.
 * Users can select categories, choose a field to update, select change type, and enter a value.
 */
export default function BulkUpdateModal({
  onClose,
  onPreview,
}: BulkUpdateModalProps) {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics(
    "Bulk Update Modal",
    false
  );
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [field, setField] = useState<
    "mrp" | "marginPercentage" | "purchaseMarginPercentage" | "taxPercentage"
  >("mrp");
  const [changeType, setChangeType] = useState<"increase" | "decrease" | "set">(
    "set"
  );
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      if (selectedStore?.id) {
        try {
          setLoading(true);
          const cats = await inventoryService.getCategories(selectedStore.id);
          setCategories(cats);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to load categories"
          );
        } finally {
          setLoading(false);
        }
      }
    };
    loadCategories();
  }, [selectedStore?.id]);

  /**
   * Handles form submission and triggers preview.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      setError("Please enter a valid positive number");
      return;
    }

    if (changeType !== "set" && numValue > 100) {
      setError("Percentage cannot exceed 100");
      return;
    }

    track(events.PRODUCT_BULK_UPDATED, {
      field: field,
      change_type: changeType,
      category_count: selectedCategoryIds.length,
      action: "preview_opened",
    });
    onPreview({
      categoryIds: selectedCategoryIds,
      field,
      changeType,
      value: numValue,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Update Products
          </h2>
          <button
            onClick={() => {
              trackButton("Close", { location: "bulk_update_modal" });
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Categories (optional - leave empty to update all products)
            </label>
            <SearchableMultiSelect
              options={categories}
              selectedIds={selectedCategoryIds}
              onChange={setSelectedCategoryIds}
              placeholder="Search and select categories..."
              loading={loading}
            />
            {selectedCategoryIds.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                {selectedCategoryIds.length} categor
                {selectedCategoryIds.length === 1 ? "y" : "ies"} selected
              </p>
            )}
          </div>

          {/* Field Selection, Change Type, and Value in same row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Field Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field to Update
              </label>
              <select
                value={field}
                onChange={(e) =>
                  setField(
                    e.target.value as
                      | "mrp"
                      | "marginPercentage"
                      | "purchaseMarginPercentage"
                      | "taxPercentage"
                  )
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="mrp">MRP (incl GST)</option>
                <option value="marginPercentage">Selling Discount %</option>
                <option value="purchaseMarginPercentage">
                  Buying Discount %
                </option>
                <option value="taxPercentage">GST %</option>
              </select>
            </div>

            {/* Change Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Type
              </label>
              <select
                value={changeType}
                onChange={(e) =>
                  setChangeType(
                    e.target.value as "increase" | "decrease" | "set"
                  )
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="increase">Increase %</option>
                <option value="decrease">Decrease %</option>
                <option value="set">Set Direct</option>
              </select>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value
                {changeType === "set" ? (
                  <span className="text-gray-500 font-normal ml-1 text-xs">
                    (exact)
                  </span>
                ) : (
                  <span className="text-gray-500 font-normal ml-1 text-xs">
                    (%, max 100)
                  </span>
                )}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={changeType === "set" ? "Enter value" : "Enter %"}
                min="0"
                max={changeType === "set" ? undefined : "100"}
                step="0.01"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Preview Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
