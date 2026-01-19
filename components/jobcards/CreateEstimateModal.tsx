/**
 * Create Estimate Modal
 * Allows creating a new estimate from job card items or manual entry
 */

"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, IndianRupee } from "lucide-react";
import { jobCardsService, JobCardItem } from "@/services/jobCards.service";

interface CreateEstimateModalProps {
  jobCardId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingItems?: JobCardItem[]; // Optional: job card items to pre-populate
}

export default function CreateEstimateModal({
  jobCardId,
  isOpen,
  onClose,
  onSuccess,
  existingItems = [],
}: CreateEstimateModalProps) {
  const [items, setItems] = useState<
    Array<{
      kind: "LABOR" | "PART";
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      discountPercentage?: number;
    }>
  >([]);
  const [notes, setNotes] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-populate from existing job card items if available
  useEffect(() => {
    if (isOpen && existingItems.length > 0 && items.length === 0) {
      const estimateItems = existingItems
        .filter((item) => item.status === "APPROVED" || item.status === "PENDING")
        .map((item) => ({
          kind: item.kind === "LABOR" ? "LABOR" as const : "PART" as const,
          name: item.name,
          description: item.description || "",
          quantity: item.qty,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate || 18,
          discountPercentage: 0,
        }));
      if (estimateItems.length > 0) {
        setItems(estimateItems);
      }
    }
  }, [isOpen, existingItems]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        kind: "LABOR",
        name: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        discountPercentage: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateItemTotal = (item: typeof items[0]) => {
    const priceAfterDiscount = item.unitPrice * (1 - (item.discountPercentage || 0) / 100);
    const baseAmount = item.taxRate > 0 
      ? priceAfterDiscount / (1 + item.taxRate / 100) 
      : priceAfterDiscount;
    const taxAmount = priceAfterDiscount - baseAmount;
    return {
      baseAmount: baseAmount * item.quantity,
      taxAmount: taxAmount * item.quantity,
      totalAmount: priceAfterDiscount * item.quantity,
    };
  };

  const calculateTotals = () => {
    let subTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    items.forEach((item) => {
      const calc = calculateItemTotal(item);
      subTotal += calc.baseAmount;
      taxTotal += calc.taxAmount;
      grandTotal += calc.totalAmount;
    });

    return { subTotal, taxTotal, grandTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validItems = items.filter(
      (item) => item.name.trim().length > 0 && item.quantity > 0 && item.unitPrice > 0
    );

    if (validItems.length === 0) {
      setError("At least one valid item is required");
      return;
    }

    try {
      setLoading(true);
      await jobCardsService.createEstimate(jobCardId, {
        items: validItems.map((item) => ({
          kind: item.kind,
          name: item.name.trim(),
          description: item.description?.trim() || undefined,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountPercentage: item.discountPercentage || undefined,
        })),
        notes: notes.trim() || undefined,
        expiresInDays,
      });

      // Reset form
      setItems([]);
      setNotes("");
      setExpiresInDays(7);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create estimate");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="w-full max-w-4xl rounded-lg bg-white shadow-xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Estimate
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Line Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item, index) => {
                  const calc = calculateItemTotal(item);
                  return (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={item.kind}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "kind",
                                e.target.value as "LABOR" | "PART"
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="LABOR">Labor</option>
                            <option value="PART">Part</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                            required
                            placeholder="Item name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description || ""}
                            onChange={(e) =>
                              handleItemChange(index, "description", e.target.value)
                            }
                            placeholder="Item description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Unit Price (₹) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "taxRate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Discount (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.discountPercentage || 0}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "discountPercentage",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Item Total Preview */}
                      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Base: ₹{calc.baseAmount.toFixed(2)} + Tax: ₹{calc.taxAmount.toFixed(2)}
                        </span>
                        <span className="font-semibold text-gray-900">
                          Total: ₹{calc.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="mt-2 text-red-600 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="h-4 w-4 inline mr-1" />
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items added yet. Click "Add Item" to start.</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes for the customer..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validity (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={expiresInDays}
                onChange={(e) =>
                  setExpiresInDays(parseInt(e.target.value) || 7)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Totals Summary */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subtotal:</span>
                  <span>₹{totals.subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Tax:</span>
                  <span>₹{totals.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-5 w-5" />
                    ₹{totals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || items.length === 0}
            >
              {loading ? "Creating..." : "Create Estimate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
