"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CreateBillingAccountModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; email: string }) => void;
  error?: string;
}

export default function CreateBillingAccountModal({
  onClose,
  onCreate,
  error,
}: CreateBillingAccountModalProps) {
  const { trackButton, track, events } = useAnalytics(
    "Create Billing Account Modal",
    false
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackButton("Create Billing Account", {
      location: "create_billing_account_modal",
    });
    track(events.BILLING_ACCOUNT_CREATED, {
      has_email: !!email.trim(),
    });
    await onCreate({ name, email });
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Create Billing Account
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                error ? "border-red-300" : "border-gray-300"
              }`}
            />
            {error && error.includes("email") && (
              <p className="mt-1 text-xs text-red-600">
                This email is already in use. Please try a different email
                address.
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                trackButton("Cancel", {
                  location: "create_billing_account_modal",
                });
                onClose();
              }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
