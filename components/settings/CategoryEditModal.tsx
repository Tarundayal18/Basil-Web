/**
 * CategoryEditModal component for editing category details.
 * Provides a modal interface for updating category information.
 */
"use client";

import { X } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Category {
  id: string;
  name: string;
  gstRate?: number;
  hsnCode?: string;
  marginPercentage?: number;
  purchaseMarginPercentage?: number;
  overheadChargesPercentage?: number;
}

interface CategoryEditData {
  name: string;
  gstRate?: number;
  hsnCode?: string;
  marginPercentage?: number;
  purchaseMarginPercentage?: number;
  overheadChargesPercentage?: number;
}

interface CategoryEditModalProps {
  editingCategory: Category | null;
  categoryEditData: CategoryEditData;
  onClose: () => void;
  onUpdate: () => void;
  onDataChange: (data: CategoryEditData) => void;
}

export function CategoryEditModal({
  editingCategory,
  categoryEditData,
  onClose,
  onUpdate,
  onDataChange,
}: CategoryEditModalProps) {
  const { trackButton, track, events } = useAnalytics(
    "Category Edit Modal",
    false
  );
  if (!editingCategory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: "linear-gradient(to right, #46499e, #e1b0d1)",
          }}
        >
          <h3 className="text-lg font-bold text-white">
            Edit Category: {editingCategory.name}
          </h3>
          <button
            onClick={() => {
              trackButton("Close", { location: "category_edit_modal_header" });
              onClose();
            }}
            className="text-white hover:text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={categoryEditData.name}
              onChange={(e) =>
                onDataChange({
                  ...categoryEditData,
                  name: e.target.value,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
              placeholder="Enter category name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={categoryEditData.gstRate ?? ""}
                onChange={(e) =>
                  onDataChange({
                    ...categoryEditData,
                    gstRate:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
                placeholder="0.00"
              />
              <p className="mt-0.5 text-xs text-gray-400">
                Tax rate for calculating GST on prices
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={categoryEditData.hsnCode || ""}
                onChange={(e) =>
                  onDataChange({
                    ...categoryEditData,
                    hsnCode: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
                placeholder="Enter HSN code"
              />
              <p className="mt-0.5 text-xs text-gray-400">
                Tax classification code for invoices
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Selling Margin Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={categoryEditData.marginPercentage ?? ""}
                onChange={(e) =>
                  onDataChange({
                    ...categoryEditData,
                    marginPercentage:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
                placeholder="0.00"
              />
              <p className="mt-0.5 text-xs text-gray-400">
                Selling Price = MRP × selling margin%/100
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Cost Margin Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                step="0.01"
                value={categoryEditData.purchaseMarginPercentage ?? ""}
                onChange={(e) =>
                  onDataChange({
                    ...categoryEditData,
                    purchaseMarginPercentage:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
                placeholder="0.00"
              />
              <p className="mt-0.5 text-xs text-gray-400">
                Cost Price = MRP × cost margin%/100
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Overhead Charges Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={categoryEditData.overheadChargesPercentage ?? ""}
                onChange={(e) =>
                  onDataChange({
                    ...categoryEditData,
                    overheadChargesPercentage:
                      e.target.value === ""
                        ? undefined
                        : parseFloat(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46499e] focus:border-[#46499e] text-sm"
                placeholder="0.00"
              />
              <p className="mt-0.5 text-xs text-gray-400">
                Category overhead charges (leave empty for store defaults)
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                trackButton("Cancel", {
                  location: "category_edit_modal_footer",
                });
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                trackButton("Save Changes", {
                  location: "category_edit_modal",
                  category_id: editingCategory.id,
                });
                track(events.CATEGORY_EDITED, {
                  category_id: editingCategory.id,
                });
                onUpdate();
              }}
              className="px-4 py-2 bg-[#46499e] text-white rounded-lg hover:bg-[#46499e]/90 font-medium text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
