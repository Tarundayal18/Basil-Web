/**
 * Payment Step Component
 * Payment processing for subscription
 */
"use client";

import { SubscriptionService } from "@/services/subscription.service";
import { CreditCard, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { PaymentStepProps } from "./types";

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

/**
 * PaymentStep component
 * Handles Razorpay payment processing
 * @param props - Payment step properties
 */
export default function PaymentStep({
  plans,
  selectedPlan,
  billingCycle,
  storeData,
  accountData,
  subscriptionId,
  registeredStoreId,
  error,
  setError,
  processingPayment,
  setProcessingPayment,
  setCurrentStep,
}: PaymentStepProps) {
  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  /**
   * Handle Razorpay payment
   */
  const handlePayment = async () => {
    if (!subscriptionId) return;

    try {
      setProcessingPayment(true);
      setError("");

      const paymentOrder = await SubscriptionService.createPaymentOrder({
        subscriptionId,
      });

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const razorpay = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "BASIL ERP",
        description: `Payment authorization for 14-day trial - ${
          storeData.name || "your store"
        }. You'll be charged ₹1 for authorization. Full payment will be deducted automatically after trial ends.`,
        order_id: paymentOrder.orderId,
        handler: async (response) => {
          try {
            await SubscriptionService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              subscriptionId,
            });
            // Go to complete step first, then redirect to dashboard
            setCurrentStep("complete");
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Payment verification failed"
            );
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          email: accountData.email,
          contact: accountData.phone || storeData.phone || undefined,
          name: accountData.name,
        },
        theme: {
          color: "#46499e",
        },
      });

      razorpay.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Complete Payment
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          You&apos;re starting a{" "}
          <span className="font-semibold">14-day free trial</span>. We&apos;ll
          charge ₹1 for payment authorization. Your full subscription amount
          will be automatically deducted after the trial period ends.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6 space-y-4">
          {storeData.name && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Store</span>
              <span className="font-medium text-gray-900">
                {storeData.name}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Plan</span>
            <span className="font-medium text-gray-900">
              {selectedPlanData?.name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Billing Cycle</span>
            <span className="font-medium text-gray-900 capitalize">
              {billingCycle}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Authorization Charge
              </span>
              <span className="text-lg font-semibold text-gray-900">₹1</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <div>
                <span className="text-lg font-semibold text-gray-900">
                  Total (Trial)
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Full amount: ₹
                  {billingCycle === "annual"
                    ? selectedPlanData?.annualPrice?.toLocaleString("en-IN")
                    : selectedPlanData?.monthlyPrice?.toLocaleString(
                        "en-IN"
                      )}{" "}
                  will be charged after trial ends
                </p>
              </div>
              <span className="text-2xl font-bold text-[#46499e]">₹1</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 text-sm">
            Secure payment via Razorpay. Pay using Credit/Debit Card, UPI, Net
            Banking, or Wallets.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={() => setCurrentStep("plan")}
          className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <button
          onClick={handlePayment}
          disabled={processingPayment}
          className="px-8 py-3 bg-[#f1b02b] text-[#46499e] rounded-xl hover:bg-[#f1b02b]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-bold transition-all"
        >
          {processingPayment ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>Pay Now</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
