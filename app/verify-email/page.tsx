/**
 * Email Verification Page
 * Handles email verification by reading token from query params,
 * calling the backend API, and displaying appropriate messages
 */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";
import { authService } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

type VerificationState = "verifying" | "success" | "error";

/**
 * VerifyEmailPageContent component
 * Handles email verification flow
 */
function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { track, trackButton, trackLink } = useAnalytics(
    "Email Verification Page",
    true
  );
  const { refreshUser, isAuthenticated } = useAuth();
  const [state, setState] = useState<VerificationState>("verifying");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const hasVerifiedRef = useRef(false);

  /**
   * Extract error message from API error
   */
  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      // Check if it's an API error with response data
      const errorMessage = err.message;

      // Try to extract more specific error from message
      if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("expired")
      ) {
        return errorMessage;
      }

      return errorMessage;
    }
    if (typeof err === "object" && err !== null) {
      const errorObj = err as {
        response?: { data?: { message?: string; error?: string } };
        message?: string;
      };
      if (errorObj.response?.data?.message) {
        return errorObj.response.data.message;
      }
      if (errorObj.response?.data?.error) {
        return errorObj.response.data.error;
      }
      if (errorObj.message) {
        return errorObj.message;
      }
    }
    return "An unexpected error occurred. Please try again.";
  };

  /**
   * Verify email on component mount
   */
  useEffect(() => {
    // Prevent multiple verification attempts
    if (hasVerifiedRef.current) {
      return;
    }

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token) {
      // Defer state update to avoid cascading renders
      setTimeout(() => {
        setState("error");
        setError(
          "Verification token is missing. Please check your email for the correct verification link."
        );
        track("email_verification_error", { reason: "missing_token" });
      }, 0);
      return;
    }

    if (!email) {
      // Defer state update to avoid cascading renders
      setTimeout(() => {
        setState("error");
        setError(
          "Email address is missing. Please check your email for the correct verification link."
        );
        track("email_verification_error", { reason: "missing_email" });
      }, 0);
      return;
    }

    /**
     * Perform email verification
     */
    const verifyEmail = async () => {
      // Mark as verifying to prevent duplicate calls
      hasVerifiedRef.current = true;

      try {
        track("email_verification_started");
        await authService.verifyEmail(token, email);

        // If user is already logged in, refresh their profile to update emailVerified status
        if (isAuthenticated) {
          try {
            await refreshUser();
            setState("success");
            setMessage(
              "Your email has been verified successfully! You can now access all features."
            );
            track("email_verification_success");

            // Redirect to dashboard after 2 seconds if logged in
            setTimeout(() => {
              trackButton("Redirect to Dashboard", {
                location: "email_verification_success",
              });
              router.push("/dashboard");
            }, 2000);
          } catch {
            // Even if refresh fails, verification succeeded
            setState("success");
            setMessage(
              "Your email has been verified successfully! Please refresh the page to see the update."
            );
            track("email_verification_success");

            setTimeout(() => {
              trackButton("Redirect to Dashboard", {
                location: "email_verification_success",
              });
              router.push("/dashboard");
            }, 2000);
          }
        } else {
          // User is not logged in
          setState("success");
          setMessage(
            "Your email has been verified successfully! You can now log in to your account."
          );
          track("email_verification_success");

          // Redirect to login after 3 seconds
          setTimeout(() => {
            trackButton("Redirect to Login", {
              location: "email_verification_success",
            });
            router.push("/login");
          }, 3000);
        }
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setState("error");
        setError(errorMessage);
        track("email_verification_error", { reason: errorMessage });
        // Reset hasVerified on error so user can retry
        hasVerifiedRef.current = false;
      }
    };

    verifyEmail();
  }, [searchParams, router, track, trackButton, isAuthenticated, refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                state === "verifying"
                  ? "bg-indigo-100"
                  : state === "success"
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {state === "verifying" && (
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              )}
              {state === "success" && (
                <CheckCircle className="w-8 h-8 text-green-600" />
              )}
              {state === "error" && (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {state === "verifying" && "Verifying Your Email"}
              {state === "success" && "Email Verified!"}
              {state === "error" && "Verification Failed"}
            </h1>
            <p className="text-sm text-gray-600">
              {state === "verifying" &&
                "Please wait while we verify your email address..."}
              {state === "success" &&
                "Your email has been successfully verified."}
              {state === "error" && "We couldn't verify your email address."}
            </p>
          </div>

          {/* Success Message */}
          {state === "success" && message && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-800">
              {message}
            </div>
          )}

          {/* Error Message */}
          {state === "error" && error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {state === "success" && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {isAuthenticated
                    ? "Redirecting to dashboard..."
                    : "Redirecting to login page..."}
                </p>
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    onClick={() =>
                      trackLink("Go to Dashboard", "/dashboard", {
                        location: "email_verification_success",
                      })
                    }
                    className="inline-flex items-center justify-center w-full bg-[#46499e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() =>
                      trackLink("Go to Login", "/login", {
                        location: "email_verification_success",
                      })
                    }
                    className="inline-flex items-center justify-center w-full bg-[#46499e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                )}
              </div>
            )}

            {state === "error" && (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={() =>
                    trackLink("Go to Login", "/login", {
                      location: "email_verification_error",
                    })
                  }
                  className="flex items-center justify-center w-full bg-[#46499e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl"
                >
                  <span>Go to Login</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/register"
                  onClick={() =>
                    trackLink("Go to Register", "/register", {
                      location: "email_verification_error",
                    })
                  }
                  className="flex items-center justify-center w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span>Back to Register</span>
                </Link>
              </div>
            )}
          </div>

          {/* Help Text */}
          {state === "error" && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                If you continue to experience issues, please contact support or
                try registering again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * VerifyEmailPage component
 * Wraps the content in Suspense boundary for useSearchParams
 */
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#46499e]" />
        </div>
      }
    >
      <VerifyEmailPageContent />
    </Suspense>
  );
}
