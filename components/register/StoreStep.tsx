/**
 * Store Step Component
 * Store information form for registration
 */
"use client";

import {
  Store,
  MapPin,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { StoreStepProps } from "./types";
import { SubscriptionService } from "@/services/subscription.service";

/**
 * StoreStep component
 * Collects store information during registration
 * @param props - Store step properties
 */
export default function StoreStep({
  storeData,
  setStoreData,
  error,
  setError,
  setCurrentStep,
  setRegisteredStoreId,
}: StoreStepProps) {
  /**
   * Handle store form submission
   */
  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!storeData.name) {
      setError("Store name is required");
      return;
    }

    try {
      // Register store with 1-month trial (no plan/billing cycle required)
      const result = await SubscriptionService.registerStore({
        ...storeData,
        startTrial: true,
        trialDays: 30, // 1 month trial
      });

      if (result.store) {
        setRegisteredStoreId(result.store.id);
        setCurrentStep("complete");
      } else {
        setError("Failed to register store");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register store. Please try again."
      );
    }
  };

  return (
    <form onSubmit={handleStoreSubmit} className="space-y-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Store Information
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Tell us about your business
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={storeData.name}
                onChange={(e) =>
                  setStoreData({
                    ...storeData,
                    name: e.target.value,
                  })
                }
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                placeholder="My Store"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                value={storeData.address}
                onChange={(e) =>
                  setStoreData({
                    ...storeData,
                    address: e.target.value,
                  })
                }
                rows={3}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent resize-none"
                placeholder="Enter your store address"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={storeData.phone}
                  onChange={(e) =>
                    setStoreData({
                      ...storeData,
                      phone: e.target.value,
                    })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                  placeholder="+91 9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={storeData.email}
                  onChange={(e) =>
                    setStoreData({
                      ...storeData,
                      email: e.target.value,
                    })
                  }
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                  placeholder="store@example.com"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GSTIN
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={storeData.gstin}
                onChange={(e) =>
                  setStoreData({
                    ...storeData,
                    gstin: e.target.value,
                  })
                }
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-8 py-3 bg-[#46499e] text-white rounded-xl hover:bg-[#46499e]/90 flex items-center gap-2 font-medium transition-all"
        >
          <span>Continue</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
