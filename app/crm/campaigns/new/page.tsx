/**
 * Create Campaign Page
 * Build and configure marketing campaigns
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, Campaign, CustomerSegment } from "@/services/crm-enhanced.service";
import Toast from "@/components/Toast";
import { useStore } from "@/contexts/StoreContext";

export default function CreateCampaignPage() {
  return (
    <ProtectedRoute>
      <CreateCampaignContent />
    </ProtectedRoute>
  );
}

function CreateCampaignContent() {
  const router = useRouter();
  const { selectedStore } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [segments, setSegments] = useState<any[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(false);

  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: "",
    type: "BULK",
    channel: "SMS",
    message: "",
    isActive: true,
  });

  useEffect(() => {
    loadSegments();
  }, []);

  const loadSegments = async () => {
    try {
      setLoadingSegments(true);
      const data = await crmEnhancedService.listSegments();
      setSegments(data);
    } catch (err) {
      console.error("Failed to load segments:", err);
    } finally {
      setLoadingSegments(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      setError("Name and message are required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await crmEnhancedService.createCampaign(formData as Omit<Campaign, "id">);
      setSuccess("Campaign created successfully");
      setTimeout(() => {
        router.push("/crm/campaigns");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Create Campaign</h1>
        <p className="text-gray-600 mt-1">Build and configure marketing campaigns</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="BULK">Bulk Campaign</option>
            <option value="TRIGGER">Trigger-Based</option>
            <option value="DRIP">Drip Campaign</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel *</label>
          <select
            value={formData.channel}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="SMS">SMS</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">Email</option>
            <option value="PUSH">Push Notification</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={6}
            required
            placeholder="Enter your campaign message... Use {name} for customer name, {store} for store name"
          />
          <p className="text-xs text-gray-500 mt-1">
            Character count: {formData.message?.length || 0} / {formData.channel === "SMS" ? "160" : "1000"}
          </p>
        </div>

        {formData.type === "TRIGGER" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
              <select
                value={formData.triggerType || ""}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select trigger</option>
                <option value="NO_PURCHASE_DAYS">No Purchase (Days)</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="ANNIVERSARY">Anniversary</option>
                <option value="SERVICE_COMPLETED">Service Completed</option>
                <option value="HIGH_VALUE_PURCHASE">High Value Purchase</option>
                <option value="ABANDONED_CART">Abandoned Cart</option>
              </select>
            </div>
            {formData.triggerType === "NO_PURCHASE_DAYS" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Days Threshold</label>
                <input
                  type="number"
                  value={formData.triggerDays || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, triggerDays: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min={1}
                />
              </div>
            )}
          </>
        )}

        {formData.type === "BULK" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
              <input
                type="datetime-local"
                value={formData.scheduledDate || ""}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment (Optional)</label>
              <select
                value={(formData as any).targetSegmentId || ""}
                onChange={(e) => setFormData({ ...formData, targetSegmentId: e.target.value || undefined } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={loadingSegments}
              >
                <option value="">All Customers</option>
                {segments.map((segment) => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name} ({segment.customerCount || 0} customers)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Target a specific customer segment, or leave blank to send to all customers
              </p>
            </div>
          </>
        )}

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
            {loading ? "Creating..." : "Create Campaign"}
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

