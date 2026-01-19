/**
 * Subscription Page Component
 * Complete subscription management page with plan switching, auto-renew toggle, and payment history
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  SubscriptionService,
  Subscription,
  SubscriptionOrTrial,
  Payment,
  SubscriptionPlan,
} from "@/services/subscription.service";
import Script from "next/script";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  IndianRupee,
  FileText,
  AlertCircle,
  Package,
  ArrowUp,
  ArrowDown,
  Settings,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

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

interface RazorpayPaymentFailedResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/**
 * SubscriptionPage component
 * Main component for managing subscriptions with plan switching and all subscription operations
 */
export default function SubscriptionPage() {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics(
    "Subscription Page",
    true
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Current subscription
  const [subscription, setSubscription] = useState<SubscriptionOrTrial | null>(
    null
  );
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  // Payments
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Payment processing
  const [processingPayment, setProcessingPayment] = useState(false);

  // Plan switching
  const [showPlanSwitch, setShowPlanSwitch] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<
    "monthly" | "annual"
  >("monthly");
  const [switchingPlan, setSwitchingPlan] = useState(false);

  // Auto-renew toggle
  const [updatingAutoRenew, setUpdatingAutoRenew] = useState(false);

  // Cancel subscription
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  /**
   * Load current subscription
   */
  const loadSubscription = useCallback(async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);
      setError("");
      const sub = await SubscriptionService.getStoreSubscription(
        selectedStore.id
      );
      setSubscription(sub);
      if (sub.billingCycle === "annual" || sub.billingCycle === "monthly") {
        setSelectedBillingCycle(sub.billingCycle as "monthly" | "annual");
      }
    } catch (err) {
      console.error("Failed to load subscription:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load subscription information"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedStore]);

  /**
   * Load available subscription plans
   */
  const loadPlans = useCallback(async () => {
    try {
      const plans = await SubscriptionService.getAvailablePlans();
      setAvailablePlans(plans);
    } catch (err) {
      console.error("Failed to load plans:", err);
    }
  }, []);

  /**
   * Load payment history
   */
  const loadPayments = useCallback(async () => {
    if (!selectedStore) return;

    try {
      setPaymentsLoading(true);
      const params: { storeId?: string; status?: string } = {
        storeId: selectedStore.id,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const paymentList = await SubscriptionService.getPayments(params);
      setPayments(paymentList);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setPaymentsLoading(false);
    }
  }, [selectedStore, statusFilter]);

  useEffect(() => {
    if (selectedStore) {
      loadSubscription();
      loadPayments();
      loadPlans();
    }
  }, [selectedStore, loadSubscription, loadPayments, loadPlans]);

  /**
   * Handle payment for subscription renewal
   */
  const handlePayment = async () => {
    if (!subscription || !selectedStore) return;

    try {
      setProcessingPayment(true);
      setError("");
      setSuccess("");

      // Create payment order
      const paymentOrder = await SubscriptionService.createPaymentOrder({
        subscriptionId: subscription.id,
      });

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "BASIL ERP",
        description: `Subscription renewal for ${selectedStore.name}`,
        order_id: paymentOrder.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            await SubscriptionService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              subscriptionId: subscription.id,
            });

            track(events.PAYMENT_COMPLETED, {
              subscription_id: subscription.id,
              payment_type: "renewal",
            });
            setSuccess(
              "Payment successful! Your subscription has been renewed."
            );
            await loadSubscription();
            await loadPayments();
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Payment verification failed"
            );
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          email: selectedStore.email || undefined,
          contact: selectedStore.phone || undefined,
        },
        theme: {
          color: "#46499e",
        },
      });

      razorpay.on("payment.failed", (response: unknown) => {
        const failedResponse = response as RazorpayPaymentFailedResponse;
        track(events.PAYMENT_FAILED, {
          subscription_id: subscription.id,
          payment_type: "renewal",
          error: failedResponse.error?.description,
        });
        setError(
          failedResponse.error?.description ||
            "Payment failed. Please try again."
        );
        setProcessingPayment(false);
      });

      razorpay.open();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate payment"
      );
      setProcessingPayment(false);
    }
  };

  /**
   * Handle plan switch
   */
  const handlePlanSwitch = async () => {
    if (!subscription || !selectedNewPlan || !selectedStore) return;

    try {
      trackButton("Switch Plan", {
        location: "subscription_page",
        current_plan: subscription.planId || "trial",
        new_plan: selectedNewPlan,
        billing_cycle: selectedBillingCycle,
      });
      track(events.SUBSCRIPTION_PLAN_SELECTED, {
        plan_id: selectedNewPlan,
        billing_cycle: selectedBillingCycle,
        action: "switch",
      });
      setSwitchingPlan(true);
      setError("");
      setSuccess("");

      // Get the new plan details
      const newPlan = availablePlans.find((p) => p.id === selectedNewPlan);
      if (!newPlan) {
        throw new Error("Selected plan not found");
      }

      // Check if it's the same plan
      if (
        subscription.planId === selectedNewPlan &&
        subscription.billingCycle === selectedBillingCycle &&
        !subscription.isTrial
      ) {
        setError("You are already on this plan and billing cycle");
        setSwitchingPlan(false);
        return;
      }

      // Create payment order for plan switch
      const paymentOrder =
        await SubscriptionService.createPlanSwitchPaymentOrder(
          subscription.id,
          selectedNewPlan,
          selectedBillingCycle
        );

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      // Open Razorpay checkout
      const razorpay = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "BASIL ERP",
        description: `Switch to ${newPlan.name} plan (${selectedBillingCycle})`,
        order_id: paymentOrder.orderId,
        handler: async (response) => {
          try {
            // Verify payment
            await SubscriptionService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              subscriptionId: subscription.id,
            });

            // Update subscription with new plan
            await SubscriptionService.updateSubscription(subscription.id, {
              planId: selectedNewPlan,
              billingCycle: selectedBillingCycle,
            });

            track(events.PAYMENT_COMPLETED, {
              subscription_id: subscription.id,
              payment_type: "plan_switch",
              new_plan: selectedNewPlan,
            });
            setSuccess(`Successfully switched to ${newPlan.name} plan!`);
            setShowPlanSwitch(false);
            setSelectedNewPlan(null);
            await loadSubscription();
            await loadPayments();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Plan switch failed");
          } finally {
            setSwitchingPlan(false);
          }
        },
        prefill: {
          email: selectedStore.email || undefined,
          contact: selectedStore.phone || undefined,
        },
        theme: {
          color: "#46499e",
        },
      });

      razorpay.on("payment.failed", (response: unknown) => {
        const failedResponse = response as RazorpayPaymentFailedResponse;
        track(events.PAYMENT_FAILED, {
          subscription_id: subscription.id,
          payment_type: "plan_switch",
          error: failedResponse.error?.description,
        });
        setError(
          failedResponse.error?.description ||
            "Payment failed. Please try again."
        );
        setSwitchingPlan(false);
      });

      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch plan");
      setSwitchingPlan(false);
    }
  };

  /**
   * Toggle auto-renew
   */
  const handleToggleAutoRenew = async () => {
    if (!subscription) return;

    try {
      const newAutoRenewValue = !subscription.autoRenew;
      trackButton("Toggle Auto Renew", {
        location: "subscription_page",
        subscription_id: subscription.id,
        new_value: newAutoRenewValue,
      });
      track(events.SUBSCRIPTION_VIEWED, {
        action: "auto_renew_toggled",
        subscription_id: subscription.id,
        auto_renew: newAutoRenewValue,
      });
      setUpdatingAutoRenew(true);
      setError("");
      const updated = await SubscriptionService.updateSubscription(
        subscription.id,
        {
          autoRenew: newAutoRenewValue,
        }
      );
      setSubscription(updated);
      setSuccess(
        `Auto-renew ${updated.autoRenew ? "enabled" : "disabled"} successfully`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update auto-renew"
      );
    } finally {
      setUpdatingAutoRenew(false);
    }
  };

  /**
   * Cancel subscription
   */
  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      trackButton("Cancel Subscription", {
        location: "subscription_page",
        subscription_id: subscription.id,
      });
      track(events.SUBSCRIPTION_VIEWED, {
        action: "cancelled",
        subscription_id: subscription.id,
      });
      setCancelling(true);
      setError("");
      await SubscriptionService.cancelSubscription(subscription.id);
      setSuccess("Subscription cancelled successfully");
      setShowCancelConfirm(false);
      await loadSubscription();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel subscription"
      );
    } finally {
      setCancelling(false);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /**
   * Get payment status badge
   */
  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /**
   * Format currency - always use INR/₹ for India
   */
  const formatCurrency = (amount: number, currency: string = "INR") => {
    // Always use INR for India, ignore currency parameter to ensure ₹ symbol
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR", // Always use INR regardless of input currency
    }).format(amount);
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Check if plan is upgrade or downgrade
   */
  const getPlanChangeType = (currentPlanId: string, newPlanId: string) => {
    const currentPlan = availablePlans.find((p) => p.id === currentPlanId);
    const newPlan = availablePlans.find((p) => p.id === newPlanId);
    if (!currentPlan || !newPlan) return null;
    return currentPlan.sequence < newPlan.sequence ? "upgrade" : "downgrade";
  };

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Please select a store to view subscription details.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            Subscription Management
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button
              onClick={() => setSuccess("")}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="ml-2 text-gray-600">Loading subscription...</span>
          </div>
        ) : subscription ? (
          <>
            {/* Current Subscription */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Subscription
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                    subscription.status
                  )}`}
                >
                  {subscription.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Plan</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.isTrial
                      ? "Free Trial"
                      : subscription.plan?.name || "N/A"}
                  </p>
                  {subscription.isTrial ? (
                    <p className="text-sm text-gray-600 mt-1">
                      {subscription.orderCount}/{subscription.maxOrders} orders
                      used
                    </p>
                  ) : (
                    subscription.plan?.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {subscription.plan?.description}
                      </p>
                    )
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Billing Cycle</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {subscription.isTrial
                      ? "Trial"
                      : subscription.billingCycle || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {subscription.endDate
                      ? `Expires on ${formatDate(subscription.endDate)}`
                      : "No expiration date"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <IndianRupee className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Price</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription.isTrial ? (
                      "Free"
                    ) : subscription.plan ? (
                      <>
                        {formatCurrency(
                          subscription.billingCycle === "annual"
                            ? subscription.plan?.annualPrice
                            : subscription.plan?.monthlyPrice
                        )}
                        <span className="text-sm font-normal text-gray-500 ml-1">
                          /
                          {subscription.billingCycle === "annual"
                            ? "year"
                            : "month"}
                        </span>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RefreshCw className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-500">Auto Renew</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <p className="text-lg font-semibold text-gray-900">
                      {subscription.autoRenew ? (
                        <span className="text-green-600 flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Enabled
                        </span>
                      ) : (
                        <span className="text-gray-600 flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          Disabled
                        </span>
                      )}
                    </p>
                    {!subscription.isTrial && (
                      <button
                        onClick={handleToggleAutoRenew}
                        disabled={updatingAutoRenew}
                        className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center space-x-1"
                      >
                        {updatingAutoRenew ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Settings className="w-3 h-3" />
                        )}
                        <span>Toggle</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              {!subscription.isTrial &&
                subscription.plan?.features &&
                subscription.plan.features.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Plan Features
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {subscription.plan?.features?.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center space-x-2 text-sm text-gray-600"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Trial Features */}
              {subscription.isTrial && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Trial Features
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <li className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Up to {subscription.maxOrders} orders</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>1-month trial period</span>
                    </li>
                    <li className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Full access to all features</span>
                    </li>
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                {!subscription.isTrial && (
                  <button
                    onClick={() => setShowPlanSwitch(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Switch Plan</span>
                  </button>
                )}
                <button
                  onClick={handlePayment}
                  disabled={
                    processingPayment || subscription.status !== "active"
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {processingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Renew Now</span>
                    </>
                  )}
                </button>
                {subscription.status === "active" && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Subscription</span>
                  </button>
                )}
              </div>
            </div>

            {/* Plan Switch Modal */}
            {showPlanSwitch && !subscription.isTrial && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Switch Subscription Plan
                    </h2>
                    <button
                      onClick={() => {
                        setShowPlanSwitch(false);
                        setSelectedNewPlan(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Billing Cycle
                      </label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setSelectedBillingCycle("monthly")}
                          className={`px-4 py-2 rounded-lg ${
                            selectedBillingCycle === "monthly"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setSelectedBillingCycle("annual")}
                          className={`px-4 py-2 rounded-lg ${
                            selectedBillingCycle === "annual"
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Annual (Save more)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {availablePlans.map((plan) => {
                        const isCurrentPlan =
                          subscription.planId === plan.id &&
                          subscription.billingCycle === selectedBillingCycle &&
                          !subscription.isTrial;
                        const price =
                          selectedBillingCycle === "annual"
                            ? plan.annualPrice
                            : plan.monthlyPrice;
                        const changeType = subscription.planId
                          ? getPlanChangeType(subscription.planId, plan.id)
                          : "upgrade";

                        return (
                          <div
                            key={plan.id}
                            onClick={() =>
                              !isCurrentPlan && setSelectedNewPlan(plan.id)
                            }
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              selectedNewPlan === plan.id
                                ? "border-indigo-600 bg-indigo-50"
                                : isCurrentPlan
                                ? "border-gray-300 bg-gray-50 opacity-60"
                                : "border-gray-200 hover:border-indigo-300"
                            } ${isCurrentPlan ? "cursor-not-allowed" : ""}`}
                          >
                            {plan.isMostPopular && (
                              <div className="bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded-full inline-block mb-2">
                                Most Popular
                              </div>
                            )}
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {plan.name}
                            </h3>
                            <div className="text-2xl font-bold text-gray-900 mb-2">
                              {formatCurrency(price)}
                              <span className="text-sm font-normal text-gray-500">
                                /
                                {selectedBillingCycle === "annual"
                                  ? "year"
                                  : "month"}
                              </span>
                            </div>
                            {plan.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {plan.description}
                              </p>
                            )}
                            {isCurrentPlan && (
                              <div className="text-sm text-indigo-600 font-medium mb-2">
                                Current Plan
                              </div>
                            )}
                            {!isCurrentPlan && changeType && (
                              <div className="flex items-center space-x-1 text-sm mb-2">
                                {changeType === "upgrade" ? (
                                  <>
                                    <ArrowUp className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                      Upgrade
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <ArrowDown className="w-4 h-4 text-orange-600" />
                                    <span className="text-orange-600 font-medium">
                                      Downgrade
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                            {plan.features && plan.features.length > 0 && (
                              <ul className="space-y-1 mt-3">
                                {plan.features
                                  .slice(0, 3)
                                  .map((feature, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs text-gray-600 flex items-start"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-green-500 mr-1 mt-0.5 flex-shrink-0" />
                                      <span>{feature}</span>
                                    </li>
                                  ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedNewPlan && (
                      <div className="border-t border-gray-200 pt-4 flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            setShowPlanSwitch(false);
                            setSelectedNewPlan(null);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePlanSwitch}
                          disabled={switchingPlan}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {switchingPlan ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4" />
                              <span>Switch & Pay</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Cancel Subscription
                        </h3>
                        <p className="text-sm text-gray-600">
                          Are you sure you want to cancel?
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      Your subscription will remain active until{" "}
                      {subscription.endDate
                        ? formatDate(subscription.endDate)
                        : "the end of the billing period"}{" "}
                      and will not renew automatically. You can reactivate
                      anytime.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Keep Subscription
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelling}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {cancelling ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>Cancel Subscription</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Payment History
                </h2>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {paymentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">
                    Loading payments...
                  </span>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No payment history found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.createdAt)}
                            {payment.paidAt && (
                              <div className="text-xs text-gray-500">
                                Paid: {formatDate(payment.paidAt)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadge(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                            {payment.razorpayPaymentId || payment.id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-4">
                No active subscription found for this store.
              </p>
              <p className="text-sm text-gray-500">
                Please contact support to set up a subscription.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
