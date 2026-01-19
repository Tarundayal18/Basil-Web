"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Check,
  X,
  Package,
  Wrench,
  IndianRupee,
  Loader2,
} from "lucide-react";
import {
  jobCardsService,
  JobCardItem,
  JobCardItemKind,
  CreateJobCardItemInput,
  UpdateJobCardItemInput,
} from "@/services/jobCards.service";
import ProductSearchDropdown from "./ProductSearchDropdown";

interface JobCardItemsManagementProps {
  jobCardId: string;
  readOnly?: boolean;
}

export default function JobCardItemsManagement({
  jobCardId,
  readOnly = false,
}: JobCardItemsManagementProps) {
  const [items, setItems] = useState<JobCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<JobCardItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, [jobCardId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await jobCardsService.listJobCardItems(jobCardId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (itemData: CreateJobCardItemInput | UpdateJobCardItemInput) => {
    try {
      setActionLoading("add");
      // For create, we need all required fields
      // Validate required fields are present
      if (!itemData.name || itemData.qty === undefined || itemData.unitPrice === undefined) {
        alert("Name, quantity, and unit price are required");
        return;
      }
      
      // ItemModal always includes kind in formData, so we can safely access it
      // Use type assertion to access kind property
      const kind = (itemData as any).kind as JobCardItemKind | undefined;
      const createData: CreateJobCardItemInput = {
        kind: kind || "PART", // Default to PART if not provided
        name: itemData.name, // Now guaranteed to be string after validation
        description: itemData.description,
        qty: itemData.qty, // Now guaranteed to be number after validation
        unitPrice: itemData.unitPrice, // Now guaranteed to be number after validation
        taxRate: itemData.taxRate,
      };
      await jobCardsService.createJobCardItem(jobCardId, createData);
      await fetchItems();
      setShowAddModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    itemData: UpdateJobCardItemInput
  ) => {
    try {
      setActionLoading(itemId);
      await jobCardsService.updateJobCardItem(jobCardId, itemId, itemData);
      await fetchItems();
      setEditingItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveItem = async (itemId: string) => {
    try {
      setActionLoading(itemId);
      await jobCardsService.approveJobCardItem(jobCardId, itemId, "APPROVED");
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve item");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectItem = async (itemId: string) => {
    try {
      setActionLoading(itemId);
      await jobCardsService.approveJobCardItem(jobCardId, itemId, "REJECTED");
      await fetchItems();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject item");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    // Convert to number if it's a string or handle null/undefined
    const numAmount = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
    if (isNaN(numAmount)) return "₹0.00";
    return `₹${numAmount.toFixed(2)}`;
  };

  // Calculate totals - ensure numeric conversion
  const totals = items.reduce(
    (acc, item) => {
      if (item.status === "APPROVED") {
        const qty = typeof item.qty === "string" ? parseFloat(item.qty) : (item.qty || 0);
        const unitPrice = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : (item.unitPrice || 0);
        const taxRate = typeof item.taxRate === "string" ? parseFloat(item.taxRate) : (item.taxRate || 0);
        const baseAmount = qty * unitPrice;
        const taxAmount = baseAmount * (taxRate / 100);
        acc.subTotal += isNaN(baseAmount) ? 0 : baseAmount;
        acc.taxTotal += isNaN(taxAmount) ? 0 : taxAmount;
        acc.grandTotal += isNaN(baseAmount + taxAmount) ? 0 : baseAmount + taxAmount;
      }
      return acc;
    },
    { subTotal: 0, taxTotal: 0, grandTotal: 0 }
  );

  const getItemKindIcon = (kind: JobCardItemKind) => {
    switch (kind) {
      case "LABOR":
        return <Wrench className="w-4 h-4" />;
      case "PART":
        return <Package className="w-4 h-4" />;
      case "FEE":
        return <IndianRupee className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: JobCardItem["status"]) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Items</h3>
        {!readOnly && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No items added yet. Click "Add Item" to get started.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Description
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Qty
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Unit Price
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Tax %
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  {!readOnly && (
                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.itemId} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getItemKindIcon(item.kind)}
                        <span className="text-sm text-gray-900">{item.kind}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {item.description || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {item.qty}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-gray-900">
                      {item.taxRate}%
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-medium text-gray-900">
                      {formatCurrency(
                        (typeof item.qty === "string" ? parseFloat(item.qty) : (item.qty || 0)) *
                        (typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : (item.unitPrice || 0)) *
                        (1 + ((typeof item.taxRate === "string" ? parseFloat(item.taxRate) : (item.taxRate || 0)) / 100))
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    {!readOnly && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {item.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => setEditingItem(item)}
                                disabled={actionLoading === item.itemId}
                                className="p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApproveItem(item.itemId)}
                                disabled={actionLoading === item.itemId}
                                className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectItem(item.itemId)}
                                disabled={actionLoading === item.itemId}
                                className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {item.status !== "PENDING" && (
                            <button
                              onClick={() => setEditingItem(item)}
                              disabled={actionLoading === item.itemId}
                              className="p-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                              title="View/Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {actionLoading === item.itemId && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totals.subTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(totals.taxTotal)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Grand Total:</span>
                  <span className="font-bold text-lg text-gray-900">
                    {formatCurrency(totals.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <ItemModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddItem}
          loading={actionLoading === "add"}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={(data) => handleUpdateItem(editingItem.itemId, data)}
          loading={actionLoading === editingItem.itemId}
        />
      )}
    </div>
  );
}

// Item Modal Component
interface ItemModalProps {
  item?: JobCardItem;
  onClose: () => void;
  onSave: (data: CreateJobCardItemInput | UpdateJobCardItemInput) => void;
  loading: boolean;
}

function ItemModal({ item, onClose, onSave, loading }: ItemModalProps) {
  const [formData, setFormData] = useState({
    kind: (item?.kind || "PART") as JobCardItemKind,
    name: item?.name || "",
    description: item?.description || "",
    qty: item?.qty || 1,
    unitPrice: item?.unitPrice || 0,
    taxRate: item?.taxRate || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const total =
    (formData.qty || 0) * (formData.unitPrice || 0) * (1 + ((formData.taxRate || 0) / 100));
  const safeTotal = typeof total === "number" && !isNaN(total) ? total : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {item ? "Edit Item" : "Add Item"}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.kind}
                onChange={(e) =>
                  setFormData({ ...formData, kind: e.target.value as JobCardItemKind })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={!!item && item.status === "APPROVED"}
              >
                <option value="LABOR">Labor</option>
                <option value="PART">Part</option>
                <option value="FEE">Fee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.qty}
                onChange={(e) =>
                  setFormData({ ...formData, qty: Number(e.target.value) })
                }
                min="0.01"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={!!item && item.status === "APPROVED"}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            {/* Use product search for PART and LABOR (labor can be stored as products with category) */}
            {(formData.kind === "PART" || formData.kind === "LABOR") ? (
              <ProductSearchDropdown
                value={formData.name}
                onChange={(product) => {
                  setFormData({
                    ...formData,
                    name: product.name,
                    unitPrice: product.unitPrice,
                    taxRate: product.taxRate,
                  });
                }}
                disabled={!!item && item.status === "APPROVED"}
                required
              />
            ) : (
              // Regular input for fees
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={!!item && item.status === "APPROVED"}
              />
            )}
            {(formData.kind === "PART" || formData.kind === "LABOR") && (
              <p className="mt-1 text-xs text-gray-500">
                Start typing to search products. Price and tax will auto-populate. Labor items can be stored as products with a "Labor" category.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!!item && item.status === "APPROVED"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: Number(e.target.value) })
                }
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                disabled={!!item && item.status === "APPROVED"}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) =>
                  setFormData({ ...formData, taxRate: Number(e.target.value) })
                }
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!!item && item.status === "APPROVED"}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total:</span>
              <span className="text-xl font-bold text-gray-900">
                ₹{safeTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {item ? "Update" : "Add"} Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

