/**
 * Create Segment Page
 * Build dynamic customer segments with rules
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, CustomerSegment } from "@/services/crm-enhanced.service";
import Toast from "@/components/Toast";

export default function CreateSegmentPage() {
  return (
    <ProtectedRoute>
      <CreateSegmentContent />
    </ProtectedRoute>
  );
}

function CreateSegmentContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<Partial<CustomerSegment>>({
    name: "",
    description: "",
    isDynamic: true,
    rules: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await crmEnhancedService.createSegment(formData as Omit<CustomerSegment, "id">);
      setSuccess("Segment created successfully");
      setTimeout(() => {
        router.push("/crm/segments");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create segment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create Segment</h1>
        <p className="text-gray-600 mt-1">Build dynamic customer segments with rules</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segment Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Segment Rules</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Lifetime Value
              </label>
              <input
                type="number"
                value={formData.rules?.lifetimeValue?.min || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      lifetimeValue: {
                        ...formData.rules?.lifetimeValue,
                        min: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Lifetime Value
              </label>
              <input
                type="number"
                value={formData.rules?.lifetimeValue?.max || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      lifetimeValue: {
                        ...formData.rules?.lifetimeValue,
                        max: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Order Count
              </label>
              <input
                type="number"
                value={formData.rules?.orderCount?.min || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      orderCount: {
                        ...formData.rules?.orderCount,
                        min: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Order Count
              </label>
              <input
                type="number"
                value={formData.rules?.orderCount?.max || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rules: {
                      ...formData.rules,
                      orderCount: {
                        ...formData.rules?.orderCount,
                        max: e.target.value ? parseInt(e.target.value) : undefined,
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="No limit"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Since Last Purchase
            </label>
            <input
              type="number"
              value={formData.rules?.lastPurchaseDays || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rules: {
                    ...formData.rules,
                    lastPurchaseDays: e.target.value ? parseInt(e.target.value) : undefined,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g., 30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customers who haven't purchased in this many days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Type
            </label>
            <select
              value={formData.rules?.customerType || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  rules: {
                    ...formData.rules,
                    customerType: value === "" 
                      ? undefined 
                      : (value as "RETAIL" | "WHOLESALE" | "CORPORATE" | "VIP"),
                  },
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Any Type</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="CORPORATE">Corporate</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isDynamic}
            onChange={(e) => setFormData({ ...formData, isDynamic: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">
            Dynamic Segment (automatically updates customer assignments)
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Segment"}
          </button>
        </div>
      </form>

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />
      <Toast
        message={success}
        type="success"
        isOpen={!!success}
        onClose={() => setSuccess("")}
      />
    </div>
  );
}

