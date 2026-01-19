/**
 * Complete Step Component
 * Success screen after registration completion
 */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { CompleteStepProps } from "./types";

/**
 * CompleteStep component
 * Displays success message and redirect to dashboard
 * @param props - Complete step properties
 */
export default function CompleteStep({
  accountData,
  registeredStoreId,
}: CompleteStepProps) {
  const router = useRouter();

  /**
   * Handle completion and redirect to onboarding
   */
  const handleComplete = React.useCallback(() => {
    // Use window.location.href for full page reload to refresh auth state
    if (typeof window !== "undefined" && registeredStoreId) {
      window.location.href = `/dashboard?onboarding=true&storeId=${registeredStoreId}`;
    } else {
      router.push("/dashboard");
    }
  }, [registeredStoreId, router]);

  /**
   * Auto-redirect after a short delay
   */
  React.useEffect(() => {
    if (registeredStoreId) {
      const timer = setTimeout(() => {
        handleComplete();
      }, 3000); // Redirect after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [registeredStoreId, handleComplete]);

  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-14 h-14 text-green-600" />
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to BASIL!
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          {accountData.name
            ? `Congratulations, ${accountData.name}!`
            : "Congratulations!"}
        </p>
        <p className="text-gray-500">
          Your account has been created successfully. You&apos;re now on a{" "}
          <span className="font-semibold text-[#46499e]">
            1-month free trial
          </span>{" "}
          with up to 10 orders.
        </p>
        <p className="text-gray-500 mt-2">
          After the trial period or when you reach 10 orders (whichever comes
          first), you&apos;ll need to subscribe to a paid plan to continue using
          the service.
        </p>
      </div>
      <div className="pt-6">
        <button
          onClick={handleComplete}
          className="px-10 py-4 bg-[#46499e] text-white rounded-xl hover:bg-[#46499e]/90 font-medium text-lg transition-all flex items-center gap-2 mx-auto"
        >
          <span>Go to Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
