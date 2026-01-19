"use client";

import { Suspense } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import LoginForm from "@/components/LoginForm";
import { Loader2 } from "lucide-react";

/**
 * LoginPageContent component
 * Contains the login form with analytics tracking
 */
function LoginPageContent() {
  useAnalytics("Login Page", true);
  return <LoginForm />;
}

/**
 * Login page component
 * Wraps the content in Suspense boundary for useSearchParams
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#46499e]" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
