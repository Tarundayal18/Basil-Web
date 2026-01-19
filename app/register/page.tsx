"use client";

import { Suspense } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import RegisterPage from "@/components/RegisterPage";

/**
 * Registration page route
 * New shopkeeper registration flow
 */
function RegisterContent() {
  useAnalytics("Register Page", true);
  return <RegisterPage />;
}

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
