"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authService, Shopkeeper, Store } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { useRouter } from "next/navigation";
import { trackEvent, AnalyticsEvents, resetUser } from "@/utils/analytics";
import { checkNeedsRegistration } from "@/utils/registration";
import { setUser as setSentryUser, clearUser as clearSentryUser, addBreadcrumb } from "@/lib/sentry";

interface AuthContextType {
  user: Shopkeeper | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPassword: (identifier: string, password: string) => Promise<void>;
  loginWithOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  needsRegistration: boolean | null; // null = not checked yet, true/false = checked
  checkRegistrationStatus: () => Promise<void>; // Check registration in background
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Shopkeeper | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRegistration, setNeedsRegistration] = useState<boolean | null>(
    null
  );
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      // Keep profile + feature payload aligned to the currently selected store.
      // This avoids "store switch shows same data" issues caused by always defaulting to first store.
      const selectedStoreId =
        typeof window !== "undefined"
          ? localStorage.getItem("selectedStoreId") || undefined
          : undefined;
      const response = await apiClient.get<{
        user: Shopkeeper & { isAdmin?: boolean };
        stores?: Store[];
        features?: Record<string, { allowed: boolean; limitValue?: number | null; currentUsage?: number }>;
        selectedStoreId?: string;
      }>("/shopkeeper/profile", selectedStoreId ? { storeId: selectedStoreId } : undefined);
      if (response.data) {
        // Store user with admin status and features
        const userData = {
          ...response.data.user,
          stores: response.data.stores,
        } as Shopkeeper;
        
        setUser(userData);

        // Persist selected store id (used by StoreContext + store switcher).
        // IMPORTANT: do not clobber an existing user-selected store with the backend default.
        if (typeof window !== "undefined") {
          const existing = localStorage.getItem("selectedStoreId");
          const resolved =
            response.data.selectedStoreId || existing || response.data.stores?.[0]?.id;
          if (resolved) {
            localStorage.setItem("selectedStoreId", resolved);
          }
        }
        
        // Set Sentry user context for error tracking
        setSentryUser(
          userData.id,
          userData.email,
          userData.name
        );
        
        // Add breadcrumb for debugging
        addBreadcrumb("User profile loaded", "auth", "info", {
          userId: userData.id,
          tenantId: userData.tenantId,
          hasStores: !!userData.stores?.length,
        });
        
        // Store features in localStorage for sidebar access
        if (response.data.features) {
          localStorage.setItem("userFeatures", JSON.stringify(response.data.features));
          // Dispatch custom event for same-tab listeners
          window.dispatchEvent(new CustomEvent("localStorageChange", {
            detail: { key: "userFeatures" },
          }));
        }
        // Always set isAdmin (even if false) to ensure proper visibility
        const isAdminValue = response.data.user.isAdmin === true;
        localStorage.setItem("isAdmin", String(isAdminValue));
        // Dispatch custom event for same-tab listeners (e.g., Sidebar)
        window.dispatchEvent(
          new CustomEvent("localStorageChange", {
            detail: { key: "isAdmin", newValue: String(isAdminValue) },
          })
        );
        
        // Store tenant role and permissions for sidebar filtering
        if (response.data.user.tenantRole) {
          localStorage.setItem("tenantRole", response.data.user.tenantRole);
          window.dispatchEvent(new CustomEvent("localStorageChange", {
            detail: { key: "tenantRole" },
          }));
        }
        if (response.data.user.tenantPermissions) {
          // Normalize tenant permissions so Sidebar can reliably read them.
          // Backend may send:
          // - string[] (["VIEW_DASHBOARD", ...])
          // - Record<string, boolean> ({ VIEW_DASHBOARD: true, ... })
          const raw = response.data.user.tenantPermissions as any;
          const normalized: Record<string, boolean> = Array.isArray(raw)
            ? raw.reduce((acc: Record<string, boolean>, p: any) => {
                if (typeof p === "string" && p.trim()) acc[p.trim()] = true;
                return acc;
              }, {})
            : raw && typeof raw === "object"
              ? Object.keys(raw).reduce((acc: Record<string, boolean>, k) => {
                  acc[k] = raw[k] === true;
                  return acc;
                }, {})
              : {};
          localStorage.setItem("tenantPermissions", JSON.stringify(normalized));
          window.dispatchEvent(new CustomEvent("localStorageChange", {
            detail: { key: "tenantPermissions" },
          }));
        }
      }
    } catch (error: unknown) {
      console.error("Failed to fetch profile:", error);
      // Only logout if it's a definitive authentication error
      // Don't logout on network errors, endpoint errors, or permission errors
      const errObj = error as { message?: unknown; status?: unknown; isAuthError?: unknown } | null;
      const msg = typeof errObj?.message === "string" ? errObj.message : "";
      const errorMessage = msg.toLowerCase();
      const status = typeof errObj?.status === "number" ? errObj.status : undefined;
      const isAuthError =
        status === 401 ||
        errObj?.isAuthError === true ||
        errorMessage.includes("invalid token: invalid signature") ||
        (errorMessage.includes("invalid token") && errorMessage.includes("signature")) ||
        errorMessage.includes("token verification failed") ||
        errorMessage.includes("token has expired") ||
        errorMessage.includes("jwt expired");
      
      if (isAuthError) {
        // Only logout on definitive auth errors
        console.warn("Definitive auth error during profile fetch, logging out", error);
        authService.logout();
      } else {
        // For other errors (network, endpoint not found, etc.), just log and continue
        // User remains logged in - they just can't fetch profile right now
        console.warn("Non-auth error during profile fetch, keeping user logged in", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login with Google OAuth
   * @param idToken - Google ID token from OAuth
   */
  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await authService.loginWithGoogle(idToken);

      // Fetch fresh profile data to ensure we have all fields including hasPassword
      await fetchProfile();

      // Check if user needs onboarding first (no tenantId)
      const { OnboardingService } = await import("@/services/onboarding.service");
      const needsOnboarding = await OnboardingService.needsOnboarding();
      
      if (needsOnboarding) {
        router.push("/onboarding");
        return;
      }

      // Always check registration status, even if backend says needsRegistration is false
      // This ensures users without stores or active subscriptions are redirected to register
      const needsReg = await checkNeedsRegistration();
      setNeedsRegistration(needsReg);

      if (needsReg || response.needsRegistration) {
        router.push("/register?step=store&googleAuth=true");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Login with email and password
   * @param email - User's email address
   * @param password - User's password
   */
  const loginWithPassword = async (identifier: string, password: string) => {
    try {
      const response = await authService.loginWithPassword({ identifier, password });

      // Fetch fresh profile data to ensure we have all fields including hasPassword
      await fetchProfile();

      // Check if user needs onboarding first (no tenantId)
      const { OnboardingService } = await import("@/services/onboarding.service");
      const needsOnboarding = await OnboardingService.needsOnboarding();
      
      if (needsOnboarding) {
        router.push("/onboarding");
        return;
      }

      // Always check registration status, even if backend says needsRegistration is false
      // This ensures users without stores or active subscriptions are redirected to register
      const needsReg = await checkNeedsRegistration();
      setNeedsRegistration(needsReg);

      if (needsReg || response.needsRegistration) {
        router.push("/register?step=store&googleAuth=true");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * Login with phone OTP
   * @param phone - User's phone number
   * @param otp - One-time password for verification
   */
  const loginWithOtp = async (phone: string, otp: string) => {
    try {
      const response = await authService.loginWithOtp(phone, otp);

      // Fetch fresh profile data to ensure we have all fields including hasPassword
      await fetchProfile();

      // Check if user needs onboarding first (no tenantId)
      const { OnboardingService } = await import("@/services/onboarding.service");
      const needsOnboarding = await OnboardingService.needsOnboarding();
      
      if (needsOnboarding) {
        router.push("/onboarding");
        return;
      }

      // Always check registration status, even if backend says needsRegistration is false
      // This ensures users without stores or active subscriptions are redirected to register
      const needsReg = await checkNeedsRegistration();
      setNeedsRegistration(needsReg);

      if (needsReg || response.needsRegistration) {
        router.push("/register?step=store&googleAuth=true");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Track logout event
    trackEvent(AnalyticsEvents.USER_LOGGED_OUT);
    
    // Clear Sentry user context
    clearSentryUser();
    addBreadcrumb("User logged out", "auth", "info");
    
    resetUser();
    authService.logout();
    setUser(null);
    setNeedsRegistration(null);
    router.push("/login");
  };

  /**
   * Check registration status in the background
   * Updates the cached registration status without blocking UI
   */
  const checkRegistrationStatus = useCallback(async () => {
    try {
      const needsReg = await checkNeedsRegistration();
      setNeedsRegistration(needsReg);
    } catch (error) {
      console.error("Error checking registration status:", error);
      // On error, assume user needs registration to be safe
      setNeedsRegistration(true);
    }
  }, []);

  /**
   * Refresh user profile and registration status
   */
  const refreshUser = useCallback(async () => {
    await fetchProfile();
    // Also refresh registration status
    await checkRegistrationStatus();
  }, [fetchProfile, checkRegistrationStatus]);

  useEffect(() => {
    // Check if user is already authenticated
    const token = authService.getToken();
    if (token) {
      // Fetch user profile
      fetchProfile().then(() => {
        // Check registration status in background after profile is loaded
        checkRegistrationStatus();
      });
    } else {
      setLoading(false);
      setNeedsRegistration(null);
    }
  }, [fetchProfile, checkRegistrationStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithPassword,
        loginWithOtp,
        logout,
        isAuthenticated: !!user || authService.isAuthenticated(),
        refreshUser,
        needsRegistration,
        checkRegistrationStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
