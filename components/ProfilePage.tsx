"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { profileService } from "@/services/profile.service";
import {
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Save,
  Edit2,
  Store,
  MapPin,
  Send,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { authService } from "@/lib/auth";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { trackButton, track, events } = useAnalytics("Profile Page", true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});

  // Email verification state
  const [sendingEmailVerification, setSendingEmailVerification] =
    useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState("");

  // Phone verification state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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

  useEffect(() => {
    if (user) {
      // Ensure phone number has +91 prefix
      const phone = user.phone || "";
      const formattedPhone = phone
        ? phone.startsWith("+91")
          ? phone
          : formatPhoneNumber(phone)
        : "";

      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: formattedPhone,
      });
    }
  }, [user]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format phone number if it's the phone field
    const processedValue = name === "phone" ? formatPhoneNumber(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    // Clear field error when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
    // Clear general error
    if (error) {
      setError("");
    }
  };

  /**
   * Validate profile form
   */
  const validateProfileForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone && formData.phone.trim().length > 0) {
      // Validate phone number format (should be +91 followed by 10 digits starting with 6-9)
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s+/g, ""))) {
        errors.phone = "Please enter a valid 10-digit phone number";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate form
    if (!validateProfileForm()) {
      setError("Please fix the errors in the form");
      return;
    }

    trackButton("Save Profile", { location: "profile_page" });
    track(events.SETTINGS_UPDATED, {
      setting_type: "profile",
      has_name: !!formData.name,
      has_email: !!formData.email,
      has_phone: !!formData.phone,
    });
    setSaving(true);
    setError("");
    setSuccess("");
    setFormErrors({});

    try {
      await profileService.updateProfile(formData);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      await refreshUser();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);

      // Try to extract field-specific errors
      if (typeof err === "object" && err !== null) {
        const errorObj = err as {
          response?: {
            data?: {
              errors?: {
                name?: string;
                email?: string;
                phone?: string;
              };
            };
          };
        };
        if (errorObj.response?.data?.errors) {
          setFormErrors(errorObj.response.data.errors);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    trackButton("Cancel Profile Edit", { location: "profile_page" });
    if (user) {
      // Ensure phone number has +91 prefix
      const phone = user.phone || "";
      const formattedPhone = phone
        ? phone.startsWith("+91")
          ? phone
          : formatPhoneNumber(phone)
        : "";

      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: formattedPhone,
      });
    }
    setIsEditing(false);
    setError("");
    setSuccess("");
    setFormErrors({});
    setPhoneOtpSent(false);
    setPhoneOtp("");
    setOtpTimer(0);
    setPhoneVerificationError("");
  };

  /**
   * Handle resending email verification
   */
  const handleResendEmailVerification = async () => {
    if (!user) return;

    // Don't allow resend if already verified
    if (user.emailVerified) {
      setEmailVerificationError("Email is already verified");
      return;
    }

    trackButton("Resend Email Verification", { location: "profile_page" });
    track(events.OTP_RESENT, { context: "email_verification" });
    setSendingEmailVerification(true);
    setEmailVerificationError("");
    setError("");
    setSuccess("");

    try {
      const response = await authService.resendEmailVerification();
      // Check if response indicates email is already verified
      const message = response?.message || "";
      if (message.toLowerCase().includes("already verified")) {
        setSuccess("Email is already verified.");
        // Refresh user data to get updated verification status
        await refreshUser();
      } else {
        setSuccess("Verification email sent! Please check your inbox.");
      }
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      // Check if the error is because email is already verified
      if (errorMessage.toLowerCase().includes("already verified")) {
        setEmailVerificationError("");
        setSuccess("Email is already verified.");
        // Refresh user data to get updated verification status
        await refreshUser();
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setEmailVerificationError(errorMessage);
        setError(errorMessage);
      }
    } finally {
      setSendingEmailVerification(false);
    }
  };

  /**
   * Handle sending phone verification OTP
   */
  const handleSendPhoneOtp = async () => {
    if (!user || !user.phone) return;

    trackButton("Send Phone OTP", { location: "profile_page" });
    track(events.OTP_SENT, { method: "Phone", context: "phone_verification" });
    setSendingPhoneOtp(true);
    setPhoneVerificationError("");
    setError("");
    setSuccess("");

    try {
      await authService.sendPhoneVerificationOtp(user.phone);
      setPhoneOtpSent(true);
      setOtpTimer(60); // 60 seconds countdown
      setSuccess("OTP sent to your phone number!");
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setPhoneVerificationError(errorMessage);
      setError(errorMessage);
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  /**
   * Handle verifying phone with OTP
   */
  const handleVerifyPhone = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setPhoneVerificationError("Please enter a valid 6-digit OTP");
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    trackButton("Verify Phone", { location: "profile_page" });
    track(events.OTP_VERIFIED, {
      method: "Phone",
      context: "phone_verification",
    });
    setVerifyingPhone(true);
    setPhoneVerificationError("");
    setError("");
    setSuccess("");

    try {
      await authService.verifyPhone(phoneOtp);
      setSuccess("Phone number verified successfully!");
      setPhoneOtpSent(false);
      setPhoneOtp("");
      setOtpTimer(0);
      await refreshUser();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setPhoneVerificationError(errorMessage);
      setError(errorMessage);
    } finally {
      setVerifyingPhone(false);
    }
  };

  /**
   * Validate password form
   */
  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordErrors = {};

    if (user?.hasPassword && !passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else {
      if (passwordForm.newPassword.length < 8) {
        errors.newPassword = "Password must be at least 8 characters long";
      } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)
      ) {
        errors.newPassword =
          "Password must contain uppercase, lowercase, and number";
      }
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle password change/set
   */
  const handlePasswordChange = async () => {
    // Validate form
    if (!validatePasswordForm()) {
      setError("Please fix the errors in the form");
      return;
    }

    trackButton("Change Password", {
      location: "profile_page",
      has_existing_password: !!user?.hasPassword,
    });
    track(events.PASSWORD_RESET_COMPLETED, {
      action: user?.hasPassword ? "changed" : "set",
    });
    setChangingPassword(true);
    setError("");
    setSuccess("");
    setPasswordErrors({});

    try {
      if (user?.hasPassword) {
        // Changing existing password
        await authService.changePassword(
          passwordForm.currentPassword,
          passwordForm.newPassword,
          passwordForm.confirmPassword
        );
      } else {
        // Setting password for Google user
        await authService.setPassword(
          passwordForm.newPassword,
          passwordForm.confirmPassword
        );
      }

      setSuccess(
        user?.hasPassword
          ? "Password changed successfully!"
          : "Password set successfully!"
      );
      setShowPasswordChange(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false,
      });
      await refreshUser();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);

      // Try to extract field-specific errors
      if (typeof err === "object" && err !== null) {
        const errorObj = err as {
          response?: {
            data?: {
              errors?: {
                currentPassword?: string;
                newPassword?: string;
                confirmPassword?: string;
              };
            };
          };
        };
        if (errorObj.response?.data?.errors) {
          setPasswordErrors(errorObj.response.data.errors);
        }
        // Check for common password errors
        if (errorMessage.toLowerCase().includes("current password")) {
          setPasswordErrors((prev) => ({
            ...prev,
            currentPassword: errorMessage,
          }));
        }
      }
    } finally {
      setChangingPassword(false);
    }
  };

  /**
   * Cancel password change
   */
  const handleCancelPasswordChange = () => {
    trackButton("Cancel Password Change", { location: "profile_page" });
    setShowPasswordChange(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    setError("");
    setSuccess("");
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Manage your account information
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              trackButton("Edit Profile", { location: "profile_page" });
              setIsEditing(true);
            }}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl font-bold text-indigo-600 shadow-md">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{user.name}</h2>
              <p className="text-indigo-100 text-sm">{user.email}</p>
              <div className="flex items-center mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {user.isActive ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Personal Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Name Field */}
              <div>
                <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
                  <User className="w-3 h-3 mr-1.5 text-gray-400" />
                  Full Name
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.name
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your name"
                      disabled={saving}
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                    {user.name || "Not set"}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
                  <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                  Email Address
                  {!isEditing &&
                    user.email &&
                    !user.email.endsWith("@temp.basil") &&
                    !user.email.startsWith("temp_") && (
                      <span
                        className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          user.emailVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.emailVerified ? (
                          <>
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Verified
                          </>
                        ) : (
                          <>
                            <XCircle className="w-2.5 h-2.5 mr-0.5" />
                            Not Verified
                          </>
                        )}
                      </span>
                    )}
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        formErrors.email
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your email"
                      disabled={saving}
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="px-3 py-1.5 bg-gray-50 rounded text-sm text-gray-900">
                      <span>{user.email || "Not set"}</span>
                      {!user.emailVerified &&
                        !user.email?.endsWith("@temp.basil") &&
                        !user.email?.startsWith("temp_") && (
                          <div className="mt-1 text-xs text-yellow-600">
                            Email must be verified to login
                          </div>
                        )}
                    </div>
                    {!isEditing &&
                      !user.emailVerified &&
                      !user.email?.endsWith("@temp.basil") &&
                      !user.email?.startsWith("temp_") && (
                        <div className="space-y-1">
                          <button
                            onClick={handleResendEmailVerification}
                            disabled={sendingEmailVerification}
                            className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {sendingEmailVerification ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Resend Verification Email</span>
                              </>
                            )}
                          </button>
                          {emailVerificationError && (
                            <p className="text-xs text-red-600">
                              {emailVerificationError}
                            </p>
                          )}
                        </div>
                      )}
                    {/* Show success message if email is verified (don't show resend button) */}
                    {!isEditing &&
                      user.emailVerified &&
                      !user.email?.endsWith("@temp.basil") &&
                      !user.email?.startsWith("temp_") && (
                        <div className="mt-1 text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Email verified successfully</span>
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="flex items-center text-xs font-medium text-gray-600 mb-1">
                  <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                  Phone Number
                  {!isEditing && user.phone && (
                    <span
                      className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                        user.phoneVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.phoneVerified ? (
                        <>
                          <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-2.5 h-2.5 mr-0.5" />
                          Not Verified
                        </>
                      )}
                    </span>
                  )}
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative flex">
                      <div className="flex items-center px-3 py-1.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l">
                        <span className="text-gray-700 font-medium text-sm">
                          +91
                        </span>
                      </div>
                      <div className="relative flex-1">
                        <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={getDisplayPhone(formData.phone)}
                          onChange={handleInputChange}
                          className={`w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-r focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            formErrors.phone
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                          placeholder="9876543210"
                          disabled={saving}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    {formErrors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="px-3 py-1.5 bg-gray-50 rounded text-sm text-gray-900 flex items-center justify-between">
                      <span>
                        {user.phone
                          ? user.phone.startsWith("+91")
                            ? user.phone
                            : `+91${user.phone.replace(/^\+?91/, "")}`
                          : "Not set"}
                      </span>
                      {user.phone && !user.phoneVerified && (
                        <span className="text-xs text-yellow-600">
                          Phone must be verified to login
                        </span>
                      )}
                    </div>
                    {!isEditing && user.phone && !user.phoneVerified && (
                      <div className="space-y-2">
                        {!phoneOtpSent ? (
                          <div className="space-y-1">
                            <button
                              onClick={handleSendPhoneOtp}
                              disabled={sendingPhoneOtp}
                              className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {sendingPhoneOtp ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Sending OTP...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  <span>Send Verification OTP</span>
                                </>
                              )}
                            </button>
                            {phoneVerificationError && !phoneOtpSent && (
                              <p className="text-xs text-red-600">
                                {phoneVerificationError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div
                              className="flex gap-2"
                              onPaste={(e) => {
                                e.preventDefault();
                                const pastedData = e.clipboardData
                                  .getData("text")
                                  .replace(/\D/g, "");
                                if (pastedData.length === 6) {
                                  const newOtp = pastedData
                                    .split("")
                                    .slice(0, 6);
                                  setPhoneOtp(newOtp.join(""));
                                  // Focus the last input
                                  const lastInput = document.querySelector(
                                    `input[name="phone-otp-5"]`
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
                                  value={phoneOtp[index] || ""}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    const newOtp = phoneOtp.split("");
                                    newOtp[index] = value;
                                    setPhoneOtp(newOtp.join(""));

                                    // Auto-focus next input
                                    if (value && index < 5) {
                                      const nextInput = document.querySelector(
                                        `input[name="phone-otp-${index + 1}"]`
                                      ) as HTMLInputElement;
                                      nextInput?.focus();
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    // Handle backspace
                                    if (
                                      e.key === "Backspace" &&
                                      !phoneOtp[index] &&
                                      index > 0
                                    ) {
                                      const prevInput = document.querySelector(
                                        `input[name="phone-otp-${index - 1}"]`
                                      ) as HTMLInputElement;
                                      prevInput?.focus();
                                    }
                                  }}
                                  name={`phone-otp-${index}`}
                                  className="w-full h-10 text-center bg-gray-50 border border-gray-200 rounded text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">
                                {otpTimer > 0
                                  ? `Resend OTP in ${otpTimer}s`
                                  : "Didn't receive OTP?"}
                              </span>
                              {otpTimer === 0 && (
                                <button
                                  type="button"
                                  onClick={handleSendPhoneOtp}
                                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                            <button
                              onClick={handleVerifyPhone}
                              disabled={verifyingPhone || phoneOtp.length !== 6}
                              className="w-full px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {verifyingPhone ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Verify Phone</span>
                                </>
                              )}
                            </button>
                            {phoneVerificationError && phoneOtpSent && (
                              <p className="text-xs text-red-600">
                                {phoneVerificationError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stores Section */}
            <div className="pt-3 border-t border-gray-200">
              <h3 className="flex items-center text-xs font-medium text-gray-600 mb-2">
                <Store className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                Assigned Stores
              </h3>
              {user.stores && user.stores.length > 0 ? (
                <div className="space-y-2">
                  {user.stores.map((store) => (
                    <div
                      key={store.id}
                      className="px-3 py-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {store.name}
                            </h4>
                            {store.isActive && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 flex-shrink-0">
                                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                                Active
                              </span>
                            )}
                          </div>
                          {store.address && (
                            <div className="flex items-center mt-0.5 text-xs text-gray-600">
                              <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{store.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded border border-gray-200 text-xs text-gray-500">
                  No stores assigned
                </div>
              )}
            </div>

            {/* Password Management */}
            {!isEditing && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center text-xs font-medium text-gray-600">
                    <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    Password
                  </h3>
                  {!showPasswordChange && (
                    <button
                      onClick={() => {
                        trackButton(
                          user?.hasPassword
                            ? "Change Password"
                            : "Set Password",
                          { location: "profile_page" }
                        );
                        setShowPasswordChange(true);
                      }}
                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium transition-colors"
                    >
                      {user?.hasPassword ? "Change Password" : "Set Password"}
                    </button>
                  )}
                </div>
                {showPasswordChange ? (
                  <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
                    {user?.hasPassword && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => {
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              });
                              // Clear error when user starts typing
                              if (passwordErrors.currentPassword) {
                                setPasswordErrors((prev) => ({
                                  ...prev,
                                  currentPassword: undefined,
                                }));
                              }
                            }}
                            className={`w-full pl-10 pr-10 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              passwordErrors.currentPassword
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                                : "border-gray-300"
                            }`}
                            placeholder="Enter current password"
                            disabled={changingPassword}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                current: !showPasswords.current,
                              })
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPasswords.current ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-xs text-red-600">
                            {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {user?.hasPassword ? "New Password" : "Password"}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            });
                            // Clear error when user starts typing
                            if (passwordErrors.newPassword) {
                              setPasswordErrors((prev) => ({
                                ...prev,
                                newPassword: undefined,
                              }));
                            }
                          }}
                          className={`w-full pl-10 pr-10 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            passwordErrors.newPassword
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter new password"
                          disabled={changingPassword}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              new: !showPasswords.new,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.new ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.newPassword ? (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordErrors.newPassword}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Must be at least 8 characters with uppercase,
                          lowercase, and number
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => {
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            });
                            // Clear error when user starts typing
                            if (passwordErrors.confirmPassword) {
                              setPasswordErrors((prev) => ({
                                ...prev,
                                confirmPassword: undefined,
                              }));
                            }
                          }}
                          className={`w-full pl-10 pr-10 py-2 text-sm border rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            passwordErrors.confirmPassword
                              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Confirm new password"
                          disabled={changingPassword}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords({
                              ...showPasswords,
                              confirm: !showPasswords.confirm,
                            })
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-600">
                          {passwordErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        onClick={handleCancelPasswordChange}
                        disabled={changingPassword}
                        className="px-4 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePasswordChange}
                        disabled={changingPassword}
                        className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {changingPassword ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" />
                            <span>
                              {user?.hasPassword
                                ? "Change Password"
                                : "Set Password"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-xs text-gray-600">
                    {user?.hasPassword
                      ? "Password is set. Click 'Change Password' to update it."
                      : "No password set. Click 'Set Password' to create one for email login."}
                  </div>
                )}
              </div>
            )}

            {/* Account Information (Read-only) */}
            <div className="pt-3 border-t border-gray-200">
              <h3 className="text-xs font-medium text-gray-600 mb-2">
                Account Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Created
                  </label>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-xs text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div>
                  <label className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Updated
                  </label>
                  <div className="px-3 py-1.5 bg-gray-50 rounded text-xs text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 font-medium flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
