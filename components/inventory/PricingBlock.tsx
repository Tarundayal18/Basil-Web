/**
 * This file contains the PricingBlock component for product pricing fields.
 */
"use client";

interface PricingBlockProps {
  mrp: string;
  purchaseMarginPercentage: string;
  marginPercentage: string;
  quantity: string;
  costPrice: string;
  costPriceBase: string;
  costGST: string;
  sellingPrice: string;
  sellingPriceBase: string;
  sellingGST: string;
  onFieldChange: (field: string, value: string) => void;
  onQuantityChange: (value: string) => void;
  editCostPriceAsBase?: boolean;
  onToggleCostPriceMode?: () => void;
  editSellingPriceAsBase?: boolean;
  onToggleSellingPriceMode?: () => void;
}

/**
 * PricingBlock component for displaying and editing product pricing information
 */
export default function PricingBlock({
  mrp,
  purchaseMarginPercentage,
  marginPercentage,
  quantity,
  costPrice,
  costPriceBase,
  costGST,
  sellingPrice,
  sellingPriceBase,
  sellingGST,
  onFieldChange,
  onQuantityChange,
  editCostPriceAsBase = false,
  onToggleCostPriceMode,
  editSellingPriceAsBase = false,
  onToggleSellingPriceMode,
}: PricingBlockProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg space-y-3 order-2 md:order-3">
      {/* Row 2: MRP, Cost Margin, Selling Margin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            MRP *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={mrp}
            onChange={(e) => onFieldChange("mrp", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Cost Margin %
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={purchaseMarginPercentage}
            onChange={(e) =>
              onFieldChange("purchaseMarginPercentage", e.target.value)
            }
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Selling Margin %
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={marginPercentage}
            onChange={(e) => onFieldChange("marginPercentage", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Row 3: Quantity, Cost Price, Selling Price */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">
              {editCostPriceAsBase
                ? "Cost Price (Base)"
                : "Cost Price (Incl GST)"}
            </label>
            {onToggleCostPriceMode && (
              <button
                type="button"
                onClick={onToggleCostPriceMode}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {editCostPriceAsBase ? "Inc GST" : "Base"}
              </button>
            )}
          </div>
          {editCostPriceAsBase ? (
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPriceBase || ""}
                onChange={(e) => {
                  // When in Base mode, input shows and edits costPriceBase directly
                  onFieldChange("costPriceBase", e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="0.00"
              />
              {costPrice && (
                <p className="mt-1 text-xs text-gray-500">
                  Cost Price (GST): ₹{costPrice} | GST: ₹{costGST || "0.00"}
                </p>
              )}
            </>
          ) : (
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => onFieldChange("costPrice", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="0.00"
              />
              {costPriceBase && (
                <p className="mt-1 text-xs text-gray-500">
                  Base: ₹{costPriceBase} | GST: ₹{costGST || "0.00"}
                </p>
              )}
            </>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">
              {editSellingPriceAsBase
                ? "Selling Price (Base)"
                : "Selling Price (Incl GST)"}
            </label>
            {onToggleSellingPriceMode && (
              <button
                type="button"
                onClick={onToggleSellingPriceMode}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                {editSellingPriceAsBase ? "Inc GST" : "Base"}
              </button>
            )}
          </div>
          {editSellingPriceAsBase ? (
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPriceBase || ""}
                onChange={(e) => {
                  // When in Base mode, input shows and edits sellingPriceBase directly
                  onFieldChange("sellingPriceBase", e.target.value);
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="0.00"
              />
              {sellingPrice && (
                <p className="mt-1 text-xs text-gray-500">
                  Selling Price (GST): ₹{sellingPrice} | GST: ₹{sellingGST || "0.00"}
                </p>
              )}
            </>
          ) : (
            <>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => onFieldChange("sellingPrice", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="0.00"
              />
              {sellingPriceBase && (
                <p className="mt-1 text-xs text-gray-500">
                  Base: ₹{sellingPriceBase} | GST: ₹{sellingGST || "0.00"}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
