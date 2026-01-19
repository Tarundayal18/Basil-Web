/**
 * Plan Step Component
 * Subscription plan selection for registration
 */
"use client";

import { authService } from "@/lib/auth";
import { SubscriptionService } from "@/services/subscription.service";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Zap,
  Gem,
} from "lucide-react";
import { PlanStepProps } from "./types";

/**
 * PlanStep component
 * Handles subscription plan selection during registration
 * @param props - Plan step properties
 */
export default function PlanStep({
  plans,
  selectedPlan,
  setSelectedPlan,
  billingCycle,
  setBillingCycle,
  existingStoreId,
  storeData,
  accountData,
  isGoogleAuth,
  error,
  setError,
  loading,
  setLoading,
  setCurrentStep,
  setSubscriptionId,
  setRegisteredStoreId,
}: PlanStepProps) {
  /**
   * Handle plan selection and proceed to payment
   */
  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedPlan) {
      setError("Please select a subscription plan");
      return;
    }

    try {
      setLoading(true);

      // Register store with subscription (or add subscription to existing store)
      // Start with 14-day trial
      const result = await SubscriptionService.registerStore(
        existingStoreId
          ? {
              storeId: existingStoreId,
              planId: selectedPlan,
              billingCycle,
              startTrial: true,
              trialDays: 14,
            }
          : {
              ...storeData,
              planId: selectedPlan,
              billingCycle,
              startTrial: true,
              trialDays: 14,
            }
      );

      if (result.subscription) {
        setSubscriptionId(result.subscription.id);
        setRegisteredStoreId(result.store.id);
        // Proceed to payment step - payment is required even for trial
        setCurrentStep("payment");
      } else {
        setError("Failed to create subscription");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register store. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get icon for plan based on name
   * @param planName - Name of the plan
   * @returns React node with icon or null
   */
  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes("business")) {
      return <Zap className="w-5 h-5 text-white" />;
    }
    if (name.includes("enterprise")) {
      return <Gem className="w-5 h-5 text-white" />;
    }
    return null;
  };

  /**
   * Check if plan is popular
   * Uses isMostPopular field from the API
   * @param plan - The subscription plan
   * @returns Boolean indicating if plan is popular
   */
  const isPopularPlan = (plan: { isMostPopular?: boolean }) => {
    return plan.isMostPopular === true;
  };

  return (
    <form onSubmit={handlePlanSubmit} className="space-y-6 overflow-x-hidden">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-hidden">
        {/* Header with title left and toggle right */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-1">
              Choose the plan that fits your business.
            </h2>
            <p className="text-gray-500 text-xs md:text-sm">
              Select the plan that best fits your business needs
            </p>
          </div>

          {/* Monthly/Annual Toggle */}
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-full self-start flex-shrink-0">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                billingCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                billingCycle === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Annual
            </button>
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold text-[#ed4734] bg-red-50 rounded-full whitespace-nowrap">
              SAVE 20%
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {plans.map((plan) => {
            const price =
              billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const isSelected = selectedPlan === plan.id;
            const isPopular = isPopularPlan(plan);
            const planIcon = getPlanIcon(plan.name);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative bg-white rounded-xl p-5 md:p-6 border-2 transition-all duration-300 cursor-pointer min-w-0 ${
                  isSelected
                    ? "border-[#46499e] bg-[#46499e]/5 shadow-xl"
                    : isPopular
                    ? "border-gray-200 shadow-xl"
                    : "border-gray-200 hover:border-[#46499e]/50 hover:shadow-lg"
                }`}
              >
                {/* Most Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-2.5 right-4 md:right-5 inline-flex items-center gap-1 bg-gray-900 text-white text-xs font-medium px-2.5 py-1 rounded-full z-10">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                    <span className="whitespace-nowrap">Most popular</span>
                  </div>
                )}

                {/* Selection Checkmark */}
                {isSelected && (
                  <div
                    className={`absolute ${
                      isPopular
                        ? "-top-2.5 left-4 md:left-5"
                        : "-top-2.5 right-4 md:right-5"
                    }`}
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 bg-[#46499e] rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    {planIcon && (
                      <div
                        className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: isPopular ? "#46499e" : "#46499e",
                        }}
                      >
                        {planIcon}
                      </div>
                    )}
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                      {plan.name}
                    </h3>
                  </div>
                  {plan.description && (
                    <p className="text-gray-500 text-xs md:text-sm line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="mb-1.5">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">
                    ₹{price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-gray-500 text-xs md:text-sm">
                    /month
                  </span>
                </div>
                <p className="text-gray-400 text-xs md:text-sm mb-5 md:mb-6">
                  Per month, billed{" "}
                  {billingCycle === "annual" ? "yearly" : "monthly"}
                </p>

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <div className="min-h-0">
                    <p className="text-xs md:text-sm font-semibold text-gray-900 mb-3">
                      Features included:
                    </p>
                    <ul className="space-y-2 max-h-48 overflow-y-auto">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gray-400 text-xs md:text-sm font-medium flex-shrink-0 mt-0.5">
                            #
                          </span>
                          <span className="text-gray-600 text-xs md:text-sm break-words">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-4 gap-4">
        {!existingStoreId && (
          <button
            type="button"
            onClick={() => setCurrentStep("store")}
            className="px-4 md:px-6 py-2.5 md:py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-all text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Back</span>
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !selectedPlan}
          className={`px-6 md:px-8 py-2.5 md:py-3 bg-[#46499e] text-white rounded-xl hover:bg-[#46499e]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-all text-sm md:text-base ${
            existingStoreId ? "ml-auto" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span className="whitespace-nowrap">Continue to Payment</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
