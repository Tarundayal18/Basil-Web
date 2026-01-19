"use client";

import { apiClient } from "./api";

export interface Store {
  id: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface Shopkeeper {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword?: boolean;
  isActive: boolean;
  isAdmin?: boolean; // Admin status from BasilSystemAdminsTable
  tenantId?: string; // Tenant ID for multi-store tenant-based subscriptions
  tenantRole?: string; // Tenant role for role-based access control
  tenantPermissions?: string[]; // Tenant permissions for feature access
  createdAt: string;
  updatedAt: string;
  stores?: Store[];
}

export interface LoginResponse {
  user: Shopkeeper;
  token: string;
  needsRegistration?: boolean;
  hasStores?: boolean;
  hasActiveSubscription?: boolean;
  storeId?: string; // Existing store ID for users who need subscription
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterOtpRequest {
  phone: string;
  name: string;
}

export interface VerifyRegistrationOtpRequest {
  phone: string;
  otp: string;
}

export interface RegisterResponse {
  shopkeeper: Shopkeeper;
  token: string;
  message: string;
}

export interface LoginPasswordRequest {
  /**
   * Backward compatible:
   * - legacy clients send { email, password }
   * - new clients can send { identifier, password } where identifier is email OR phone
   */
  identifier?: string;
  email?: string;
  phone?: string;
  password: string;
}

export const authService = {
  /**
   * Register a new shopkeeper
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      "/shopkeeper/auth/register",
      data
    );
    const result = response.data!;

    // Set the authentication token from registration response
    if (result.token) {
      apiClient.setToken(result.token);
    }

    return result;
  },

  /**
   * Send OTP for registration
   */
  async sendRegistrationOtp(data: RegisterOtpRequest): Promise<void> {
    await apiClient.post("/shopkeeper/auth/register/otp/send", data);
  },

  /**
   * Verify OTP and complete registration
   */
  async registerWithOtp(
    data: VerifyRegistrationOtpRequest
  ): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      "/shopkeeper/auth/register/otp/verify",
      data
    );
    const result = response.data!;

    // Set the authentication token from registration response
    if (result.token) {
      apiClient.setToken(result.token);
    }

    return result;
  },

  /**
   * Login with email and password
   */
  async loginWithPassword(data: LoginPasswordRequest): Promise<LoginResponse> {
    const response = await apiClient.post<{ user: Shopkeeper; token: string }>(
      "/shopkeeper/auth/login/password",
      data
    );

    if (response.data && "token" in response.data && "user" in response.data) {
      apiClient.setToken(response.data.token);
      return response.data as LoginResponse;
    }

    throw new Error("Invalid response from server");
  },

  /**
   * Send OTP for phone login
   */
  async sendLoginOtp(phone: string): Promise<void> {
    await apiClient.post("/shopkeeper/auth/login/otp/send", { phone });
  },

  /**
   * Verify OTP and login with phone
   */
  async loginWithOtp(phone: string, otp: string): Promise<LoginResponse> {
    const response = await apiClient.post<{ user: Shopkeeper; token: string }>(
      "/shopkeeper/auth/login/otp/verify",
      { phone, otp }
    );

    if (response.data && "token" in response.data && "user" in response.data) {
      apiClient.setToken(response.data.token);
      return response.data as LoginResponse;
    }

    throw new Error("Invalid response from server");
  },

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<{ user: Shopkeeper; token: string }>(
      "/shopkeeper/auth/login",
      {
        idToken,
      }
    );

    if (response.data && "token" in response.data && "user" in response.data) {
      apiClient.setToken(response.data.token);
      return response.data as LoginResponse;
    }

    throw new Error("Invalid response from server");
  },

  /**
   * Verify email
   * @param token - Email verification token
   * @param email - Email address to verify
   */
  async verifyEmail(token: string, email: string): Promise<void> {
    const encodedEmail = encodeURIComponent(email);
    await apiClient.get(
      `/shopkeeper/auth/verify-email?token=${token}&email=${encodedEmail}`
    );
  },

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<{ message?: string }> {
    const response = await apiClient.post<{ message?: string }>("/shopkeeper/auth/email/resend-verification");
    return response.data || {};
  },

  /**
   * Send phone verification OTP
   */
  async sendPhoneVerificationOtp(phone: string): Promise<void> {
    await apiClient.post("/shopkeeper/auth/phone/send-otp", { phone });
  },

  /**
   * Verify phone with OTP
   */
  async verifyPhone(otp: string): Promise<void> {
    await apiClient.post("/shopkeeper/auth/phone/verify", { otp });
  },

  /**
   * Change password (requires current password)
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    await apiClient.post("/shopkeeper/auth/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Set password (for Google users who don't have a password)
   */
  async setPassword(
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    // Use change password endpoint without current password
    // Backend will handle this case
    await apiClient.post("/shopkeeper/auth/change-password", {
      newPassword,
      confirmPassword,
    });
  },

  /**
   * Initiate forgot password flow by sending OTP to verified contact(s)
   */
  async forgotPassword(identifier: string): Promise<void> {
    await apiClient.post("/shopkeeper/auth/forgot-password", { identifier });
  },

  /**
   * Verify password reset OTP and get reset token
   */
  async verifyPasswordResetOtp(
    identifier: string,
    otp: string
  ): Promise<{ resetToken: string }> {
    const response = await apiClient.post<{ resetToken: string }>(
      "/shopkeeper/auth/verify-password-reset-otp",
      { identifier, otp }
    );
    return response.data!;
  },

  /**
   * Reset password using reset token
   * @param resetToken - The password reset token
   * @param password - The new password
   * @param confirmPassword - Confirmation of the new password
   * @param email - The email address (required for DynamoDB lookup)
   */
  async resetPassword(
    resetToken: string,
    password: string,
    confirmPassword: string,
    identifier: string
  ): Promise<void> {
    await apiClient.post("/shopkeeper/auth/reset-password", {
      resetToken,
      password,
      confirmPassword,
      identifier,
    });
  },

  logout() {
    apiClient.setToken(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },

  getToken(): string | null {
    return (
      apiClient["token"] ||
      (typeof window !== "undefined" ? localStorage.getItem("token") : null)
    );
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
