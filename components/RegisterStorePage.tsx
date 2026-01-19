/**
 * Register Store Page Component
 * Handles store registration with subscription selection
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  SubscriptionService,
  SubscriptionPlan,
} from "@/services/subscription.service";
import Script from "next/script";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export default function RegisterStorePage() {
  const router = useRouter();
  const { trackButton, track, events } = useAnalytics(
    "Register Store Page",
    true
  );
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [startTrial, setStartTrial] = useState(false);
  const [trialDays, setTrialDays] = useState(7);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
  });

  useEffect(() => {
    loadPlans();
  }, []);

  /**
   * Load available subscription plans
   */
  const loadPlans = async () => {
    try {
      setLoading(true);
      const availablePlans = await SubscriptionService.getAvailablePlans();
      setPlans(availablePlans);
      if (availablePlans.length > 0) {
        setSelectedPlan(availablePlans[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input change
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPlan) {
      setError("Please select a subscription plan");
      return;
    }

    trackButton("Register Store", {
      location: "register_store_page",
      plan_id: selectedPlan,
      billing_cycle: billingCycle,
      start_trial: startTrial,
    });
    track(events.STORE_CREATED, {
      plan_id: selectedPlan,
      billing_cycle: billingCycle,
      is_trial: startTrial,
    });
    try {
      setLoading(true);
      const result = await SubscriptionService.registerStore({
        ...formData,
        planId: selectedPlan,
        billingCycle,
        startTrial,
        trialDays: startTrial ? trialDays : undefined,
      });

      setSuccess("Store registered successfully!");

      // If subscription was created (not trial), proceed to payment
      if (result.subscription && !result.trial) {
        // Redirect to payment or show payment modal
        setTimeout(() => {
          router.push(`/dashboard?storeId=${result.store.id}`);
        }, 2000);
      } else if (result.trial) {
        // Trial started, redirect to dashboard
        setTimeout(() => {
          router.push(`/dashboard?storeId=${result.store.id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register store");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Register Your Store</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Store Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GSTIN
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              Select Subscription Plan
            </h2>
            {loading && plans.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading plans...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {selectedPlan === plan.id && (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-indigo-600">
                          ₹
                          {billingCycle === "annual"
                            ? plan.annualPrice
                            : plan.monthlyPrice}
                        </span>
                        <span className="text-sm font-normal text-gray-500">
                          /{billingCycle === "annual" ? "year" : "month"}
                        </span>
                      </div>
                      {billingCycle === "annual" && (
                        <div className="text-sm text-gray-600">
                          <span className="line-through text-gray-400">
                            ₹{plan.monthlyPrice * 12}
                          </span>
                          <span className="ml-2 text-green-600 font-semibold">
                            Save ₹{plan.monthlyPrice * 12 - plan.annualPrice} (
                            {Math.round(
                              ((plan.monthlyPrice * 12 - plan.annualPrice) /
                                (plan.monthlyPrice * 12)) *
                                100
                            )}
                            %)
                          </span>
                        </div>
                      )}
                      {billingCycle === "monthly" && (
                        <div className="text-sm text-gray-600">
                          <span className="text-gray-500">
                            Annual: ₹{plan.annualPrice}/year
                          </span>
                          <span className="ml-2 text-green-600 font-semibold">
                            Save ₹{plan.monthlyPrice * 12 - plan.annualPrice} (
                            {Math.round(
                              ((plan.monthlyPrice * 12 - plan.annualPrice) /
                                (plan.monthlyPrice * 12)) *
                                100
                            )}
                            %)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBillingCycle("monthly");
                          }}
                          className={`px-3 py-1 text-xs rounded ${
                            billingCycle === "monthly"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBillingCycle("annual");
                          }}
                          className={`px-3 py-1 text-xs rounded ${
                            billingCycle === "annual"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          Annual
                        </button>
                      </div>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {plan.description}
                      </p>
                    )}
                    {plan.features.length > 0 && (
                      <ul className="text-sm text-gray-600 space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <svg
                              className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trial Option */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="startTrial"
                checked={startTrial}
                onChange={(e) => setStartTrial(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="startTrial"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Start with a free trial
              </label>
            </div>
            {startTrial && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trial Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !selectedPlan}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Registering..." : "Register Store"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
