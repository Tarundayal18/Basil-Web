/**
 * Login Form Component
 * Supports Google OAuth, Mobile OTP, and Email/Password authentication
 */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Smartphone,
} from "lucide-react";

type LoginMethod = "google" | "phone" | "email";

/**
 * LoginForm component
 * Handles multiple authentication methods
 */
export default function LoginForm() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("google");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const {
    loginWithGoogle,
    loginWithPassword,
    loginWithOtp,
    isAuthenticated,
    loading: authLoading,
    needsRegistration,
    checkRegistrationStatus,
  } = useAuth();
  const router = useRouter();
  const { track, trackButton, events } = useAnalytics("Login Page", false);

  // Email/Password state (identifier can be email OR phone)
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone/OTP state
  const [phone, setPhone] = useState(""); // Stores phone with +91 prefix
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check registration status in background
      checkRegistrationStatus();
      // Redirect based on cached status
      if (needsRegistration === true) {
        router.push("/register");
      } else if (needsRegistration === false) {
        router.push("/dashboard");
      }
      // If needsRegistration is null, the check is in progress, wait for it
    }
  }, [
    isAuthenticated,
    authLoading,
    needsRegistration,
    checkRegistrationStatus,
    router,
  ]);

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

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
   * Handle Google OAuth success
   */
  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    try {
      setError("");
      if (!credentialResponse.credential) {
        setError("No credential received from Google. Please try again.");
        track(events.USER_LOGIN_FAILED, {
          method: "google",
          error: "no_credential",
        });
        return;
      }
      setLoading(true);
      track(events.USER_LOGGED_IN, { method: "google" });
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      console.error("Google login error:", err);
      track(events.USER_LOGIN_FAILED, {
        method: "google",
        error: err instanceof Error ? err.message : "unknown",
      });
      if (err instanceof Error) {
        setError(err.message || "Login failed. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth error
   */
  const handleGoogleError = () => {
    track(events.USER_LOGIN_FAILED, {
      method: "google",
      error: "oauth_error",
    });
    setError("Google sign in failed. Please try again.");
  };

  /**
   * Handle email/password login
   */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Please enter email/phone and password");
      track(events.USER_LOGIN_FAILED, {
        method: "email",
        error: "missing_fields",
      });
      return;
    }

    try {
      setLoading(true);
      track(events.USER_LOGGED_IN, { method: "email" });
      await loginWithPassword(identifier, password);
      // Clear error on success
      setError("");
    } catch (err) {
      // Don't log authentication errors to console (they're expected user errors)
      // Only log unexpected errors
      const isAuthError =
        err instanceof Error &&
        (err as { isAuthError?: unknown }).isAuthError === true;
      if (!isAuthError) {
        console.error("Email login error:", err);
      }
      
      const errorMessage = err instanceof Error ? err.message : "Login failed. Please try again.";
      
      track(events.USER_LOGIN_FAILED, {
        method: "email",
        error: errorMessage,
      });
      
      // Set user-friendly error message
      // For authentication errors, show a friendly message without technical details
      if (isAuthError) {
        setError("Invalid credentials. Please check and try again.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send OTP to phone number
   */
  const handleSendOtp = async () => {
    setError("");

    // Validate phone number format (should be +91 followed by 10 digits starting with 6-9)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ""))) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      track(events.FEATURE_USED, { feature: "send_otp", method: "phone" });
      await authService.sendLoginOtp(phone);
      setOtpSent(true);
      setOtpTimer(60); // 60 seconds countdown
      setError("");
    } catch (err) {
      console.error("Send OTP error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP and login
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      track(events.USER_LOGGED_IN, { method: "otp" });
      await loginWithOtp(phone, otp);
    } catch (err) {
      console.error("Verify OTP error:", err);
      track(events.USER_LOGIN_FAILED, {
        method: "otp",
        error: err instanceof Error ? err.message : "invalid_otp",
      });
      setError(
        err instanceof Error ? err.message : "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#46499e]">
        <div className="text-white bg-red-500/20 border border-red-300/30 rounded-lg p-4">
          Google Client ID is not configured. Please set
          NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#46499e] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#e1b0d1]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#f1b02b]/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#ed4734]/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12">
          <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <Image
              src="/Basil-logo.png"
              alt="BASIL"
              width={180}
              height={72}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Manage Your Store
            <br />
            <span className="text-[#f1b02b]">Effortlessly</span>
          </h2>
          <p className="text-white/70 text-center text-lg max-w-md">
            The complete ERP solution for modern retailers. Track inventory,
            manage sales, and grow your business.
          </p>

          {/* Feature highlights */}
          <div className="mt-12 grid grid-cols-2 gap-6 max-w-md">
            {[
              "Inventory Management",
              "Sales Tracking",
              "Invoice Generation",
              "Business Reports",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-white/80"
              >
                <div className="w-2 h-2 bg-[#f1b02b] rounded-full" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/Basil_Symbol.png"
              alt="BASIL"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-500">Sign in to your account</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Login Method Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  trackButton("Login Method Selected", { method: "google" });
                  setLoginMethod("google");
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === "google"
                    ? "bg-white text-[#46499e] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill={loginMethod === "google" ? "#46499e" : "currentColor"}
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill={loginMethod === "google" ? "#46499e" : "currentColor"}
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill={loginMethod === "google" ? "#46499e" : "currentColor"}
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill={loginMethod === "google" ? "#46499e" : "currentColor"}
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  trackButton("Login Method Selected", { method: "phone" });
                  setLoginMethod("phone");
                  setError("");
                  setOtpSent(false);
                  setPhone("");
                  setOtp("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === "phone"
                    ? "bg-white text-[#46499e] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Phone
              </button>
              <button
                type="button"
                onClick={() => {
                  trackButton("Login Method Selected", { method: "email" });
                  setLoginMethod("email");
                  setError("");
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === "email"
                    ? "bg-white text-[#46499e] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Google Login */}
            {loginMethod === "google" && (
              <div className="space-y-6">
                <p className="text-center text-gray-500 text-sm">
                  Sign in quickly with your Google account
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
            )}

            {/* Phone/OTP Login */}
            {loginMethod === "phone" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
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
                        value={getDisplayPhone(phone)}
                        onChange={(e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          setPhone(formatted);
                        }}
                        placeholder="9876543210"
                        disabled={otpSent}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-r-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <div
                      className="flex gap-2 justify-center"
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData
                          .getData("text")
                          .replace(/\D/g, "");
                        if (pastedData.length === 6) {
                          const newOtp = pastedData.split("").slice(0, 6);
                          setOtp(newOtp.join(""));
                          // Focus the last input
                          const lastInput = document.querySelector(
                            `input[name="otp-5"]`
                          ) as HTMLInputElement;
                          lastInput?.focus();
                        }
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          value={otp[index] || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            const newOtp = otp.split("");
                            newOtp[index] = value;
                            setOtp(newOtp.join(""));

                            // Auto-focus next input
                            if (value && index < 5) {
                              const nextInput = document.querySelector(
                                `input[name="otp-${index + 1}"]`
                              ) as HTMLInputElement;
                              nextInput?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            // Handle backspace
                            if (
                              e.key === "Backspace" &&
                              !otp[index] &&
                              index > 0
                            ) {
                              const prevInput = document.querySelector(
                                `input[name="otp-${index - 1}"]`
                              ) as HTMLInputElement;
                              prevInput?.focus();
                            }
                          }}
                          name={`otp-${index}`}
                          className="w-11 h-12 text-center bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {otpTimer > 0
                          ? `Resend OTP in ${otpTimer}s`
                          : "Didn't receive OTP?"}
                      </span>
                      {otpTimer === 0 && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-sm text-[#46499e] hover:text-[#46499e]/80 font-medium"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type={otpSent ? "submit" : "button"}
                  onClick={!otpSent ? handleSendOtp : undefined}
                  disabled={loading}
                  className="w-full py-3 bg-[#46499e] text-white font-medium rounded-xl hover:bg-[#46499e]/90 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{otpSent ? "Verifying..." : "Sending OTP..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{otpSent ? "Verify & Login" : "Send OTP"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Email/Password Login */}
            {loginMethod === "email" && (
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email or Phone
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="example@domain.com or +91XXXXXXXXXX"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
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
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#46499e] hover:text-[#46499e]/80"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#46499e] text-white font-medium rounded-xl hover:bg-[#46499e]/90 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#46499e] hover:text-[#46499e]/80 font-medium"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-gray-400 text-xs">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-gray-500 hover:text-[#46499e]">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
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
