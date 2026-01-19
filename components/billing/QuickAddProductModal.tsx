/**
 * QuickAddProductModal - Simplified product creation for billing
 * 
 * When a product is not found during billing, staff can quickly add it with:
 * - Product Name
 * - MRP
 * - GST (%) (optional)
 * - Discount (%)
 * - Quantity
 * - Option to enter price as "inc GST" or "base"
 * 
 * The product is created with:
 * - Purchase price = Selling price (temporary, owner can fix later)
 * - Quantity as negative (to indicate sold without inventory)
 * - Owner receives alert about negative stock
 */

"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { inventoryService } from "@/services/inventory.service";

interface QuickAddProductModalProps {
  initialName?: string;
  onClose: () => void;
  onAdd: (productData: {
    name: string;
    storeId: string;
    mrp: number;
    sellingPrice: number;
    discountPercentage: number;
    quantity: number; // Will be negative to indicate sold without inventory
    taxPercentage?: number;
  }) => Promise<void>;
}

export default function QuickAddProductModal({
  initialName = "",
  onClose,
  onAdd,
}: QuickAddProductModalProps) {
  const { selectedStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [editSellingPriceAsBase, setEditSellingPriceAsBase] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName,
    mrp: "",
    gstPercentage: "",
    discountPercentage: "0",
    quantity: "1",
    sellingPriceInput: "", // User input for selling price
    sellingPriceBase: "", // Calculated base price
    sellingGST: "", // Calculated GST amount
  });
  const [error, setError] = useState("");
  const [isManualSellingPrice, setIsManualSellingPrice] = useState(false); // Track if user manually entered selling price

  // CRITICAL FIX: Recalculate prices when GST, MRP, discount, or mode changes
  // This ensures consistent behavior with AddProductModal
  useEffect(() => {
    const mrp = parseFloat(formData.mrp) || 0;
    const gstPercentage = parseFloat(formData.gstPercentage) || 0;
    const discountPercentage = parseFloat(formData.discountPercentage) || 0;
    const taxRate = gstPercentage > 0 ? gstPercentage / 100 : 0; // CRITICAL: Handle zero/empty GST
    const sellingPriceInput = parseFloat(formData.sellingPriceInput) || 0;

    // Calculate final price (MRP after discount)
    const finalPrice = mrp > 0 
      ? (discountPercentage > 0 ? mrp * (1 - discountPercentage / 100) : mrp)
      : 0;

    // If user has manually entered selling price, recalculate base/GST from it
    if (sellingPriceInput > 0 && isManualSellingPrice) {
      let calculatedBase = 0;
      let calculatedGST = 0;
      let calculatedIncl = 0;

      if (editSellingPriceAsBase) {
        // User entered base price
        calculatedBase = sellingPriceInput;
        calculatedIncl = taxRate > 0 
          ? calculatedBase * (1 + taxRate)
          : calculatedBase;
        calculatedGST = calculatedIncl - calculatedBase;
      } else {
        // User entered price incl GST
        calculatedIncl = sellingPriceInput;
        calculatedBase = taxRate > 0 
          ? calculatedIncl / (1 + taxRate)
          : calculatedIncl;
        calculatedGST = calculatedIncl - calculatedBase;
      }

      setFormData(prev => ({
        ...prev,
        sellingPriceBase: calculatedBase.toFixed(2),
        sellingGST: calculatedGST.toFixed(2),
      }));
    } else if (finalPrice > 0 && !isManualSellingPrice) {
      // Auto-calculate from MRP/discount
      let calculatedSellingPrice = 0;
      let calculatedBase = 0;
      let calculatedGST = 0;
      let calculatedIncl = 0;

      if (editSellingPriceAsBase) {
        // Base mode: calculate base from final price (which is incl GST)
        calculatedBase = taxRate > 0 
          ? finalPrice / (1 + taxRate)
          : finalPrice;
        calculatedSellingPrice = calculatedBase; // Input shows base
        calculatedIncl = taxRate > 0 
          ? calculatedBase * (1 + taxRate)
          : calculatedBase;
        calculatedGST = calculatedIncl - calculatedBase;
      } else {
        // Inc GST mode: selling price = final price
        calculatedSellingPrice = finalPrice; // Input shows incl GST
        calculatedIncl = finalPrice;
        calculatedBase = taxRate > 0 
          ? calculatedIncl / (1 + taxRate)
          : calculatedIncl;
        calculatedGST = calculatedIncl - calculatedBase;
      }

      setFormData(prev => ({
        ...prev,
        sellingPriceInput: calculatedSellingPrice.toFixed(2),
        sellingPriceBase: calculatedBase.toFixed(2),
        sellingGST: calculatedGST.toFixed(2),
      }));
    } else if (mrp <= 0) {
      // Clear if MRP is invalid
      setFormData(prev => ({
        ...prev,
        sellingPriceInput: "",
        sellingPriceBase: "",
        sellingGST: "",
      }));
    }
  }, [formData.mrp, formData.gstPercentage, formData.discountPercentage, editSellingPriceAsBase, isManualSellingPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedStore?.id) {
      setError("No store selected");
      return;
    }

    if (!formData.name.trim()) {
      setError("Product name is required");
      return;
    }

    const mrp = parseFloat(formData.mrp);
    const gstPercentage = parseFloat(formData.gstPercentage) || 0;
    const sellingPriceInput = parseFloat(formData.sellingPriceInput);
    const discountPercentage = parseFloat(formData.discountPercentage) || 0;
    const quantity = parseInt(formData.quantity) || 1;

    if (isNaN(mrp) || mrp <= 0) {
      setError("Valid MRP is required");
      return;
    }

    // Calculate final selling price
    // CRITICAL FIX: If discount is 0, selling price should equal MRP
    // Only apply discount when discountPercentage > 0
    const finalPrice = discountPercentage > 0 
      ? mrp * (1 - discountPercentage / 100)
      : mrp;
    
    // CRITICAL FIX: Calculate final selling price based on mode
    // This ensures consistency with AddProductModal logic
    let sellingPrice: number;
    const taxRate = gstPercentage > 0 ? gstPercentage / 100 : 0;
    
    if (editSellingPriceAsBase) {
      // Base mode: convert base to incl GST
      const basePrice = parseFloat(formData.sellingPriceBase) || parseFloat(formData.sellingPriceInput) || 0;
      sellingPrice = taxRate > 0 
        ? basePrice * (1 + taxRate)
        : basePrice;
    } else {
      // Inc GST mode: use selling price input directly (already incl GST)
      sellingPrice = sellingPriceInput > 0 ? sellingPriceInput : finalPrice;
    }

    if (sellingPrice <= 0) {
      setError("Valid selling price is required");
      return;
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      setError("Discount must be between 0 and 100");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    try {
      setLoading(true);
      await onAdd({
        name: formData.name.trim(),
        storeId: selectedStore.id,
        mrp,
        sellingPrice,
        discountPercentage,
        quantity, // This will be stored as negative in backend
        taxPercentage: gstPercentage > 0 ? gstPercentage : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  // Use calculated values from state
  const sellingPriceBase = parseFloat(formData.sellingPriceBase) || 0;
  const sellingPriceIncl = parseFloat(formData.sellingPriceInput) || 0;
  const sellingGST = parseFloat(formData.sellingGST) || 0;
  const gstPercentage = parseFloat(formData.gstPercentage) || 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Quick Add Product</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product name"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                MRP <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST (%) <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.gstPercentage}
                onChange={(e) => setFormData({ ...formData, gstPercentage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                {editSellingPriceAsBase
                  ? "Selling Price (Base)"
                  : "Selling Price (Incl GST)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditSellingPriceAsBase(!editSellingPriceAsBase);
                  setIsManualSellingPrice(false); // Reset manual flag when toggling
                }}
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
            </div>
            {editSellingPriceAsBase ? (
              <>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPriceBase || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      sellingPriceBase: value,
                      sellingPriceInput: value // Sync input with base for display
                    }));
                    setIsManualSellingPrice(true);
                  }}
                  onFocus={() => setIsManualSellingPrice(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Base price"
                  required
                />
                {sellingPriceIncl > 0 && gstPercentage > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selling Price (GST): ₹{sellingPriceIncl.toFixed(2)} | GST: ₹{sellingGST.toFixed(2)}
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPriceInput}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, sellingPriceInput: e.target.value }));
                    setIsManualSellingPrice(true);
                  }}
                  onFocus={() => setIsManualSellingPrice(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Price incl GST"
                  required
                />
                {sellingPriceBase > 0 && gstPercentage > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Base: ₹{sellingPriceBase.toFixed(2)} | GST: ₹{sellingGST.toFixed(2)}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Any quantity allowed - will be stored as negative in inventory</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
