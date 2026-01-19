"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { customersService } from "@/services/customers.service";

interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({
  onClose,
  onSuccess,
}: AddCustomerModalProps) {
  const { selectedStore } = useStore();
  const { track, trackButton, events } = useAnalytics("Add Customer Modal", false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    customerType: "retail" as "retail" | "wholesale" | "corporate" | "vip",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) {
      setError("No store selected");
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Name and phone are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      track(events.CUSTOMER_ADDED, {
        customerType: formData.customerType,
        has_email: !!formData.email.trim(),
      });
      await customersService.createCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        customerType: formData.customerType,
        storeId: selectedStore.id,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create customer"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Customer</h2>
          <button
            onClick={() => {
              trackButton("Close", { location: "add_customer_modal" });
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {!selectedStore && (
          <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg text-yellow-800 text-sm">
            No store available. Please contact administrator.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Phone number"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Email address"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type
              </label>
              <select
                value={formData.customerType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customerType: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="corporate">Corporate</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedStore}
              className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "Saving..." : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
