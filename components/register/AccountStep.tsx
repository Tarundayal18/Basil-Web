/**
 * Account Step Component
 * First step of registration - account creation with Google or email
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAnalytics } from "@/hooks/useAnalytics";
import { authService } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { AccountStepProps } from "./types";
import BrandingPanel from "./BrandingPanel";
import MobileHeader from "./MobileHeader";

/**
 * AccountStep component
 * Handles the account creation step with Google OAuth and email registration
 * @param props - Account step properties
 */
export default function AccountStep({
  accountData,
  setAccountData,
  error,
  setError,
  loading,
  setLoading,
  showPassword,
  setShowPassword,
  isGoogleAuth,
  setIsGoogleAuth,
  setCurrentStep,
  setExistingStoreId,
  invitationToken,
}: AccountStepProps) {
  const router = useRouter();
  const { track, trackLink, events } = useAnalytics("Register Page", false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationMethod, setRegistrationMethod] = useState<"email" | "otp">(
    "otp"
  );
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  /**
   * Format phone number to ensure it has +91 prefix
   * @param phone - Phone number input
   * @returns Formatted phone number with +91 prefix
   */
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, "");

    // Remove leading 0 or 91 if present
    let cleanDigits = digits;
    if (cleanDigits.startsWith("91") && cleanDigits.length === 12) {
      cleanDigits = cleanDigits.substring(2);
    } else if (cleanDigits.startsWith("0") && cleanDigits.length === 11) {
      cleanDigits = cleanDigits.substring(1);
    }

    // Limit to 10 digits
    cleanDigits = cleanDigits.substring(0, 10);

    // Return with +91 prefix
    return cleanDigits ? `+91${cleanDigits}` : "";
  };

  /**
   * Get display phone number (without +91 prefix for input)
   * @param phone - Full phone number with +91
   * @returns Phone number without +91 prefix
   */
  const getDisplayPhone = (phone: string | undefined): string => {
    if (!phone) return "";
    // Remove +91 prefix for display
    return phone.replace(/^\+91/, "");
  };

  /**
   * Handle Google OAuth registration
   */
  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setError("");
      if (!credentialResponse.credential) {
        setError("No credential received from Google. Please try again.");
        return;
      }

      setLoading(true);
      track(events.USER_SIGNED_UP, { method: "google" });
      const response = await authService.loginWithGoogle(
        credentialResponse.credential
      );

      // Mark as Google authenticated
      setIsGoogleAuth(true);

      // Update account data from Google response
      if (response.user) {
        setAccountData({
          name: response.user.name || "",
          email: response.user.email || "",
          phone: response.user.phone || "",
          password: "",
          confirmPassword: "",
        });
      }

      // Store existing store ID if available
      if (response.storeId) {
        setExistingStoreId(response.storeId);
      }

      // Determine next step based on user's current state
      if (!response.needsRegistration) {
        router.push("/dashboard");
      } else if (response.hasStores && !response.hasActiveSubscription) {
        setCurrentStep("plan");
      } else {
        setCurrentStep("store");
      }
    } catch (err) {
      console.error("Google registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Google registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google login error
   */
  const handleGoogleError = () => {
    track(events.USER_LOGIN_FAILED, { method: "google", location: "register" });
    setError("Google sign in failed. Please try again.");
  };

  /**
   * Handle sending OTP for registration
   */
  const handleSendOtp = async () => {
    setError("");

    if (!accountData.name || !accountData.phone) {
      setError("Please enter your name and phone number");
      return;
    }

    // Validate phone number format (should be +91 followed by 10 digits starting with 6-9)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(accountData.phone.replace(/\s+/g, ""))) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setSendingOtp(true);
      track(events.USER_SIGNED_UP, { method: "otp", step: "send_otp" });
      await authService.sendRegistrationOtp({
        phone: accountData.phone!,
        name: accountData.name,
      });

      setOtpSent(true);
      setCountdown(60); // 60 seconds countdown

      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  /**
   * Handle account registration
   */
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isGoogleAuth) {
      setCurrentStep("store");
      return;
    }

    // Handle OTP registration
    if (registrationMethod === "otp") {
      if (!otpSent) {
        await handleSendOtp();
        return;
      }

      if (!otp || otp.length !== 6) {
        setError("Please enter the 6-digit OTP");
        return;
      }

      try {
        setLoading(true);
        track(events.USER_SIGNED_UP, { method: "otp", step: "verify_otp" });

        const endpoint = invitationToken
          ? `/shopkeeper/auth/register/otp/verify?invitationToken=${encodeURIComponent(invitationToken)}`
          : "/shopkeeper/auth/register/otp/verify";

        const res = await apiClient.post<{ token: string }>(endpoint, {
          phone: accountData.phone!,
          otp,
        });

        if (res.data?.token) {
          apiClient.setToken(res.data.token);
        }

        setCurrentStep("store");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Registration failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle email/password registration
    if (!accountData.name || !accountData.email || !accountData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (accountData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (accountData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      track(events.USER_SIGNED_UP, { method: "email" });

      const endpoint = invitationToken
        ? `/shopkeeper/auth/register?invitationToken=${encodeURIComponent(invitationToken)}`
        : "/shopkeeper/auth/register";

      const res = await apiClient.post<{ token: string }>(endpoint, {
        ...accountData,
        confirmPassword,
      });

      if (res.data?.token) {
        apiClient.setToken(res.data.token);
      }

      setCurrentStep("store");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <BrandingPanel
        title="Start Your Journey"
        subtitle="With BASIL"
        description="Create your account and set up your store in minutes. Join thousands of retailers managing their business smarter."
        benefits={[
          "Free setup & onboarding support",
          "Start with a 14-day free trial",
          "Cancel anytime, no questions asked",
        ]}
      />

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <MobileHeader />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-500">Get started with BASIL</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Google OAuth Option */}
            <div className="mb-6">
              <p className="text-center text-gray-500 text-sm mb-4">
                Fastest way to get started
              </p>
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  size="large"
                  shape="rectangular"
                  width={320}
                />
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">
                  Or register with
                </span>
              </div>
            </div>

            {/* Registration Method Toggle */}
            <div className="mb-6 flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setRegistrationMethod("otp");
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  registrationMethod === "otp"
                    ? "bg-white text-[#46499e] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mobile & OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegistrationMethod("email");
                  setOtpSent(false);
                  setOtp("");
                  setError("");
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  registrationMethod === "email"
                    ? "bg-white text-[#46499e] shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Email & Password
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={accountData.name}
                    onChange={(e) =>
                      setAccountData({
                        ...accountData,
                        name: e.target.value,
                      })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {registrationMethod === "email" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={accountData.email}
                        onChange={(e) =>
                          setAccountData({
                            ...accountData,
                            email: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative flex">
                      <div className="flex items-center px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl">
                        <span className="text-gray-700 font-medium">+91</span>
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={getDisplayPhone(accountData.phone)}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setAccountData({
                              ...accountData,
                              phone: formatted,
                            });
                          }}
                          maxLength={10}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={accountData.password}
                        onChange={(e) =>
                          setAccountData({
                            ...accountData,
                            password: e.target.value,
                          })
                        }
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                        placeholder="At least 8 characters"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Must be at least 8 characters with uppercase, lowercase,
                      and number
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                        placeholder="Re-enter your password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex">
                      <div className="flex items-center px-4 py-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl">
                        <span className="text-gray-700 font-medium">+91</span>
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={getDisplayPhone(accountData.phone)}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setAccountData({
                              ...accountData,
                              phone: formatted,
                            });
                          }}
                          maxLength={10}
                          disabled={otpSent}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  {otpSent ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter OTP <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            setOtp(value);
                          }}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent text-center text-2xl tracking-widest"
                          placeholder="000000"
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <p className="text-gray-500">
                          OTP sent to {accountData.phone}
                        </p>
                        {countdown > 0 ? (
                          <p className="text-gray-500">
                            Resend OTP in {countdown}s
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="text-[#46499e] hover:text-[#46499e]/80 font-medium disabled:opacity-50"
                          >
                            Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  sendingOtp ||
                  (registrationMethod === "otp" && !otpSent && countdown > 0)
                }
                className="w-full py-3 bg-[#46499e] text-white font-medium rounded-xl hover:bg-[#46499e]/90 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading || sendingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>
                      {sendingOtp ? "Sending OTP..." : "Creating Account..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {registrationMethod === "otp" && !otpSent
                        ? "Send OTP"
                        : "Create Account"}
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  onClick={() =>
                    trackLink("Sign In", "/login", {
                      location: "register_page",
                    })
                  }
                  className="text-[#46499e] hover:text-[#46499e]/80 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-gray-400 text-xs">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              onClick={() =>
                trackLink("Terms of Service", "/terms", {
                  location: "register_page",
                })
              }
              className="text-gray-500 hover:text-[#46499e]"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              onClick={() =>
                trackLink("Privacy Policy", "/privacy", {
                  location: "register_page",
                })
              }
              className="text-gray-500 hover:text-[#46499e]"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
