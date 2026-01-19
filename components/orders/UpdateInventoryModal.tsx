/**
 * This file contains the UpdateInventoryModal component which allows updating
 * inventory stock for products that have insufficient stock when creating a bill.
 */

"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface InsufficientStockItem {
  productId: string;
  productName: string;
  availableQuantity: number;
  requestedQuantity: number;
  currentStock: number;
}

interface UpdateInventoryModalProps {
  items: InsufficientStockItem[];
  onClose: () => void;
  onUpdate: (
    updates: Array<{ productId: string; newQuantity: number }>
  ) => Promise<void>;
}

/**
 * UpdateInventoryModal component displays products with insufficient stock
 * and allows updating their inventory quantities.
 */
export default function UpdateInventoryModal({
  items,
  onClose,
  onUpdate,
}: UpdateInventoryModalProps) {
  const { trackButton, track, events } = useAnalytics("Update Inventory Modal", false);
  // Initialize stock updates with current stock values as strings for input fields
  // Using useState with function initializer to ensure it only runs once per component mount
  const [stockUpdates, setStockUpdates] = useState<Map<string, string>>(() => {
    const initialUpdates = new Map<string, string>();
    items.forEach((item) => {
      // Use currentStock value, convert to string for input field
      initialUpdates.set(item.productId, String(item.currentStock));
    });
    return initialUpdates;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Updates the stock quantity for a specific product.
   * @param productId - The product ID to update
   * @param value - The new stock quantity value (as string from input)
   */
  const handleStockChange = (productId: string, value: string) => {
    // Allow empty string for clearing, but store as string
    setStockUpdates(new Map(stockUpdates.set(productId, value)));
    setError("");
  };

  /**
   * Handles the update action by updating all products and calling the onUpdate callback.
   */
  const handleUpdate = async () => {
    try {
      setLoading(true);
      setError("");

      // Validate that all quantities are at least the requested amount
      const updates: Array<{ productId: string; newQuantity: number }> = [];
      for (const item of items) {
        const valueStr = stockUpdates.get(item.productId);
        // Parse the string value, defaulting to currentStock if empty or invalid
        const newQuantity =
          valueStr && valueStr.trim() !== ""
            ? parseInt(valueStr, 10)
            : item.currentStock;

        // Validate it's a valid number
        if (isNaN(newQuantity) || newQuantity < item.requestedQuantity) {
          setError(
            `${item.productName} stock (${
              isNaN(newQuantity) ? "invalid" : newQuantity
            }) is less than requested quantity (${item.requestedQuantity})`
          );
          setLoading(false);
          return;
        }
        updates.push({
          productId: item.productId,
          newQuantity,
        });
      }

      await onUpdate(updates);
      // Close modal after successful update
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update inventory"
      );
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Update Inventory Stock
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            The following products have insufficient stock. Please update their
            quantities to proceed with creating the bill.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4">
          {items.map((item) => {
            // Get current update value as string for input field
            const currentUpdateStr = stockUpdates.get(item.productId);
            // For display/validation, parse to number, defaulting to currentStock
            const currentUpdateNum =
              currentUpdateStr && currentUpdateStr.trim() !== ""
                ? parseInt(currentUpdateStr, 10)
                : item.currentStock;
            const shortfall = item.requestedQuantity - item.availableQuantity;
            const minimumRequired = item.requestedQuantity;

            return (
              <div
                key={item.productId}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {item.productName}
                    </h3>
                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                      <p>
                        Available:{" "}
                        <span className="font-medium">
                          {item.availableQuantity}
                        </span>
                      </p>
                      <p>
                        Requested:{" "}
                        <span className="font-medium">
                          {item.requestedQuantity}
                        </span>
                      </p>
                      <p className="text-red-600">
                        Shortfall:{" "}
                        <span className="font-medium">{shortfall}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Stock Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={minimumRequired}
                      value={currentUpdateStr ?? String(item.currentStock)}
                      onChange={(e) =>
                        handleStockChange(item.productId, e.target.value)
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="Enter new quantity"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      (Min: {minimumRequired})
                    </span>
                  </div>
                  {!isNaN(currentUpdateNum) &&
                    currentUpdateNum < minimumRequired && (
                      <p className="mt-1 text-sm text-red-600">
                        Quantity must be at least {minimumRequired} to fulfill
                        the order
                      </p>
                    )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => {
              trackButton("Cancel", { location: "update_inventory_modal" });
              onClose();
            }}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            {loading ? "Updating..." : "Update Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
