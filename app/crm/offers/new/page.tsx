/**
 * Create Offer Page
 * Build promotional offers and coupons
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, Offer } from "@/services/crm-enhanced.service";
import Toast from "@/components/Toast";

export default function CreateOfferPage() {
  return (
    <ProtectedRoute>
      <CreateOfferContent />
    </ProtectedRoute>
  );
}

function CreateOfferContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState<Partial<Offer>>({
    name: "",
    code: "",
    type: "PERCENTAGE",
    channel: "SMS",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    autoSuggest: false,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.validFrom || !formData.validUntil) {
      setError("Name and validity dates are required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await crmEnhancedService.createOffer(formData as Omit<Offer, "id">);
      setSuccess("Offer created successfully");
      setTimeout(() => {
        router.push("/crm/offers");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create Offer</h1>
        <p className="text-gray-600 mt-1">Build promotional offers and coupons</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Offer Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
          <input
            type="text"
            value={formData.code || ""}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
            placeholder="Optional - leave blank for auto-generated"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="PERCENTAGE">Percentage Discount</option>
            <option value="FIXED_AMOUNT">Fixed Amount Discount</option>
            <option value="BUY_X_GET_Y">Buy X Get Y</option>
            <option value="FREE_SHIPPING">Free Shipping</option>
          </select>
        </div>

        {formData.type === "PERCENTAGE" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Percentage *
            </label>
            <input
              type="number"
              value={formData.discountPercentage || ""}
              onChange={(e) =>
                setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={0}
              max={100}
              required
            />
          </div>
        )}

        {formData.type === "FIXED_AMOUNT" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Amount *
            </label>
            <input
              type="number"
              value={formData.discountAmount || ""}
              onChange={(e) =>
                setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={0}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Purchase</label>
          <input
            type="number"
            value={formData.minimumPurchase || ""}
            onChange={(e) =>
              setFormData({ ...formData, minimumPurchase: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            min={0}
            placeholder="No minimum"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment (Optional)</label>
          <select
            value={(formData as any).targetSegmentId || ""}
            onChange={(e) => setFormData({ ...formData, targetSegmentId: e.target.value || undefined } as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Customers</option>
            {/* Segments will be loaded dynamically if needed */}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Limit this offer to a specific customer segment
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Usage per Customer</label>
          <input
            type="number"
            value={formData.maxUsagePerCustomer || ""}
            onChange={(e) =>
              setFormData({ ...formData, maxUsagePerCustomer: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            min={1}
            placeholder="Unlimited"
          />
          <p className="text-xs text-gray-500 mt-1">
            How many times a single customer can use this offer
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
          <input
            type="number"
            value={formData.totalUsageLimit || ""}
            onChange={(e) =>
              setFormData({ ...formData, totalUsageLimit: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            min={1}
            placeholder="Unlimited"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum total number of times this offer can be used across all customers
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.autoSuggest}
            onChange={(e) => setFormData({ ...formData, autoSuggest: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">
            Auto-suggest at billing (show best offer to customer)
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">Active</label>
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
            {loading ? "Creating..." : "Create Offer"}
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

