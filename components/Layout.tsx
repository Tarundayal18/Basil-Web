"use client";

/**
 * Layout component that provides the main application structure with sidebar and header.
 * Manages sidebar state persistence across page navigations using localStorage.
 */
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import OnboardingTour from "./OnboardingTour";
import { Mail, X, Send, Loader2, AlertCircle } from "lucide-react";

const SIDEBAR_STATE_KEY = "sidebarOpen";

/**
 * Gets the initial sidebar state from localStorage or defaults based on screen size.
 * @returns The initial sidebar open state
 */
function getInitialSidebarState(): boolean {
  if (typeof window === "undefined") {
    return true; // SSR fallback
  }

  const isMobile = window.innerWidth < 1024;
  if (isMobile) {
    return false; // Mobile: always start closed
  }

  // Desktop: restore from localStorage or default to true
  const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
  if (savedState !== null) {
    return savedState === "true";
  }
  return true;
}

/**
 * Layout component that wraps the application with sidebar and header.
 * @param children - The child components to render in the main content area
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showEmailVerificationPrompt, setShowEmailVerificationPrompt] =
    useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [hasCheckedEmailVerification, setHasCheckedEmailVerification] =
    useState(false);

  // Initialize state directly from localStorage to avoid animation on mount
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });

  // Check if onboarding should be shown
  useEffect(() => {
    const onboardingParam = searchParams.get("onboarding");
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");

    if (onboardingParam === "true") {
      // If coming from registration/payment, clear previous completion to show tour again
      if (onboardingCompleted === "true") {
        localStorage.removeItem("onboardingCompleted");
      }
      // Reset email verification check so it can show after onboarding
      setHasCheckedEmailVerification(false);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
    }
  }, [searchParams]);

  /**
   * Check if user has a real email (not a temp email from OTP registration)
   * @param email - User's email address
   * @returns True if email is a real email that needs verification
   */
  const hasRealEmail = (email: string | undefined | null): boolean => {
    if (!email) return false;
    // Temp emails from OTP registration end with @temp.basil or start with temp_
    return !email.endsWith("@temp.basil") && !email.startsWith("temp_");
  };

  // Email verification prompt removed - users can verify in settings if they want
  // Removed automatic popup on login

  // Handle window resize and update mobile state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // On mobile, always close sidebar; on desktop, restore saved state
      if (mobile) {
        setSidebarOpen(false);
      } else {
        const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
        if (savedState !== null) {
          setSidebarOpen(savedState === "true");
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Persist sidebar state to localStorage when it changes (desktop only)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
    }
  }, [sidebarOpen, isMobile]);

  // Close email verification prompt if email gets verified
  useEffect(() => {
    if (user?.emailVerified && showEmailVerificationPrompt) {
      setShowEmailVerificationPrompt(false);
    }
  }, [user?.emailVerified, showEmailVerificationPrompt]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
        onNavigate={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={() => {
            setShowOnboarding(false);
            // Remove onboarding param from URL
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("onboarding");
              window.history.replaceState({}, "", url.toString());
            }
            // Email verification prompt removed - users can verify in settings
          }}
        />
      )}

      {/* Email Verification Prompt - Removed - Users can verify in settings */}
    </div>
  );
}

/**
 * Layout component wrapper with Suspense for useSearchParams
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-gray-50 flex overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
