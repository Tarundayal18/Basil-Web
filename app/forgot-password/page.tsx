/**
 * Forgot Password Page
 * Multi-step flow: Email -> OTP Verification -> Reset Password
 */
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";
import { authService } from "@/lib/auth";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

type Step = "identifier" | "otp" | "reset";

/**
 * ForgotPasswordPageContent component
 * Handles the complete password reset flow
 */
function ForgotPasswordPageContent() {
  const router = useRouter();
  const { trackButton, trackLink, track, events } = useAnalytics(
    "Forgot Password Page",
    true
  );
  const [step, setStep] = useState<Step>("identifier");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Identifier step state (email OR phone)
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState("");

  // OTP step state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resetToken, setResetToken] = useState("");

  // Reset password step state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // OTP timer countdown
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  /**
   * Extract error message from API error
   */
  const extractErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
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

  const isEmail = (value: string) => value.includes("@");

  /**
   * Validate identifier (email OR Indian phone)
   */
  const validateIdentifier = (value: string): boolean => {
    const v = value.trim();
    if (!v) {
      setIdentifierError("Email or phone is required");
      return false;
    }
    if (isEmail(v)) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setIdentifierError("Please enter a valid email address");
        return false;
      }
    } else {
      const normalized = v.replace(/\s+/g, "");
      const phoneRegex = /^(\+?91|0)?[6-9]\d{9}$/;
      if (!phoneRegex.test(normalized)) {
        setIdentifierError("Please enter a valid phone number");
        return false;
      }
    }
    setIdentifierError("");
    return true;
  };

  /**
   * Handle email submission
   */
  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateIdentifier(identifier)) {
      return;
    }

    setLoading(true);
    try {
      track(events.PASSWORD_RESET_REQUESTED, {
        identifier,
        type: isEmail(identifier) ? "email" : "phone",
      });
      await authService.forgotPassword(identifier);
      setSuccess(
        "If an account exists with this identifier, an OTP has been sent to your verified phone number and/or email address."
      );
      setStep("otp");
      setOtpTimer(60); // 60 seconds countdown
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OTP input change
   */
  const handleOtpChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);
    setOtpError("");

    // Auto-focus next input
    if (numericValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle OTP key down
   */
  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle OTP paste
   */
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("").slice(0, 6);
      setOtp(newOtp);
      otpInputRefs.current[5]?.focus();
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    setError("");
    setOtpError("");
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);

    try {
      trackButton("Resend OTP", { location: "forgot_password" });
      await authService.forgotPassword(identifier);
      setSuccess("OTP resent successfully!");
      setOtpTimer(60);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OTP verification
   */
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOtpError("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyPasswordResetOtp(
        identifier,
        otpValue
      );
      setResetToken(response.resetToken);
      setStep("reset");
      setSuccess("OTP verified successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setOtpError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate password form
   */
  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordErrors = {};

    if (!password) {
      errors.password = "Password is required";
    } else {
      if (password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        errors.password =
          "Password must contain uppercase, lowercase, and number";
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle password reset
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePasswordForm()) {
      setError("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      track(events.PASSWORD_RESET_COMPLETED);
      await authService.resetPassword(
        resetToken,
        password,
        confirmPassword,
        identifier
      );
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to login link */}
        <Link
          href="/login"
          onClick={() =>
            trackLink("Back to Login", "/login", {
              location: "forgot_password",
            })
          }
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#46499e] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-gray-600">
              {step === "identifier" &&
                "Enter your email or phone to receive a verification code"}
              {step === "otp" &&
                "Enter the 6-digit code sent to your verified phone number and/or email address"}
              {step === "reset" && "Enter your new password"}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === "identifier"
                    ? "bg-indigo-600 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {step !== "identifier" ? <CheckCircle className="w-5 h-5" /> : "1"}
              </div>
              <div
                className={`h-1 w-12 ${
                  step === "reset" ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === "otp"
                    ? "bg-indigo-600 text-white"
                    : step === "reset"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step === "reset" ? <CheckCircle className="w-5 h-5" /> : "2"}
              </div>
              <div
                className={`h-1 w-12 ${
                  step === "reset" ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === "reset"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-800">
              {success}
            </div>
          )}

          {/* Step 1: Email */}
          {step === "identifier" && (
            <form onSubmit={handleIdentifierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Phone
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setIdentifierError("");
                      setError("");
                    }}
                    className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent ${
                      identifierError
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="example@domain.com or +91XXXXXXXXXX"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {identifierError && (
                  <p className="mt-1 text-xs text-red-600">{identifierError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#46499e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <div
                  className="flex gap-2 justify-center"
                  onPaste={handleOtpPaste}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      className="w-12 h-12 text-center text-lg font-semibold bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent"
                      disabled={loading}
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="mt-2 text-xs text-red-600 text-center">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {otpTimer > 0
                    ? `Resend OTP in ${otpTimer}s`
                    : "Didn't receive OTP?"}
                </span>
                {otpTimer === 0 && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-[#46499e] hover:text-[#3a3d85] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full bg-[#46499e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordErrors.password) {
                        setPasswordErrors((prev) => ({
                          ...prev,
                          password: undefined,
                        }));
                      }
                    }}
                    className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent ${
                      passwordErrors.password
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="Enter new password"
                    disabled={loading}
                    autoFocus
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
                {passwordErrors.password ? (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordErrors.password}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with uppercase, lowercase, and
                    number
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors((prev) => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }
                    }}
                    className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#46499e] focus:border-transparent ${
                      passwordErrors.confirmPassword
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-200"
                    }`}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#46499e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#3a3d85] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ForgotPasswordPage component
 * Wraps the content in Suspense boundary for useSearchParams
 */
export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#46499e]" />
        </div>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
