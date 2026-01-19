"use client";

/**
 * ProtectedRoute component
 * Protects routes by checking authentication, registration status, and onboarding status
 * Redirects to login if not authenticated, to register if registration is incomplete,
 * or to onboarding if tenant is not set up
 * Registration and onboarding checks are done in background without blocking navigation
 */
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "./Layout";

// Pages that should be accessible without onboarding check
const PUBLIC_ONBOARDING_PAGES = [
  "/login",
  "/register",
  "/onboarding",
  "/forgot-password",
  "/verify-email",
];

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    isAuthenticated,
    loading,
    needsRegistration,
    checkRegistrationStatus,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedRegistration = useRef(false);
  const hasRedirected = useRef(false);
  const hasCheckedOnboarding = useRef(false);
  const hasRedirectedToOnboarding = useRef(false);

  useEffect(() => {
    // Only check authentication, don't block on registration/onboarding checks
    if (!loading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // Check registration status in background (only once on mount)
    // This doesn't block the UI, just updates the cached status
    if (!loading && isAuthenticated && !hasCheckedRegistration.current) {
      hasCheckedRegistration.current = true;
      checkRegistrationStatus();
    }
  }, [isAuthenticated, loading, router, checkRegistrationStatus]);

  // Handle registration redirect in a separate effect that doesn't block rendering
  useEffect(() => {
    // Only redirect if we have a definitive answer about registration status
    // and we're not already on the register page or onboarding pages
    const isOnPublicPage = PUBLIC_ONBOARDING_PAGES.some(page => pathname.startsWith(page));
    
    if (
      !loading &&
      isAuthenticated &&
      needsRegistration === true &&
      pathname !== "/register" &&
      !isOnPublicPage &&
      !hasRedirected.current
    ) {
      hasRedirected.current = true;
      router.push("/register");
    }
  }, [loading, isAuthenticated, needsRegistration, pathname, router]);

  // Handle onboarding redirect in a separate effect that doesn't block rendering
  useEffect(() => {
    // Skip if:
    // 1. Still loading
    // 2. Not authenticated
    // 3. Already redirected to onboarding
    // 4. On a public page that doesn't require onboarding (including /onboarding)
    // 5. Still needs registration (handle that first - registration takes priority)
    // 6. User already has tenantId (onboarding already complete)
    const isOnPublicPage = PUBLIC_ONBOARDING_PAGES.some(page => pathname.startsWith(page));
    const needsOnboarding = user && !user.tenantId && !needsRegistration;
    
    // Early return for all skip conditions
    if (
      loading ||
      !isAuthenticated ||
      hasRedirectedToOnboarding.current ||
      isOnPublicPage ||
      needsRegistration !== false || // Wait for definitive answer (not null, not true)
      !needsOnboarding ||
      user?.tenantId // User already has tenant
    ) {
      return;
    }
    
    // Only redirect if we haven't checked yet or need to redirect
    if (!hasCheckedOnboarding.current && pathname !== "/onboarding") {
      hasCheckedOnboarding.current = true;
      hasRedirectedToOnboarding.current = true;
      router.push("/onboarding");
    }
  }, [loading, isAuthenticated, user, needsRegistration, pathname, router]);

  // Show loading only for initial auth check, not for registration/onboarding checks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Special handling for onboarding page - render it without Layout wrapper
  // This allows onboarding to have its own full-screen layout
  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  // For all other pages, render with Layout wrapper
  // Registration and onboarding checks happen in background via useEffects above
  return <Layout>{children}</Layout>;
}
