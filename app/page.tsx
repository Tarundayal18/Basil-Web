"use client";

/**
 * Home page that displays the landing page for unauthenticated users
 * and redirects authenticated users to the dashboard or register page.
 */
import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import LandingPage from "@/components/LandingPage";

/**
 * HomeContent component
 * Contains the home page logic with analytics tracking
 */
function HomeContent() {
  const router = useRouter();
  const {
    isAuthenticated,
    loading,
    needsRegistration,
    checkRegistrationStatus,
  } = useAuth();
  useAnalytics("Landing Page", true);

  useEffect(() => {
    // Check registration status in background if authenticated
    if (!loading && isAuthenticated) {
      checkRegistrationStatus();
    }
  }, [isAuthenticated, loading, checkRegistrationStatus]);

  useEffect(() => {
    // Redirect based on cached registration status
    if (!loading && isAuthenticated) {
      if (needsRegistration === true) {
        router.push("/register");
      } else if (needsRegistration === false) {
        router.push("/dashboard");
      }
      // If needsRegistration is null, wait for the check to complete
    }
  }, [isAuthenticated, loading, needsRegistration, router]);

  // Show landing page for unauthenticated users
  if (!loading && !isAuthenticated) {
    return <LandingPage />;
  }

  // Show loading state only while checking authentication
  // Registration check happens in background and doesn't block UI
  if (loading || (isAuthenticated && needsRegistration === null)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#46499e]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // This shouldn't be reached, but just in case
  return null;
}

/**
 * Home component
 * Wraps the content in Suspense boundary for useSearchParams
 */
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#46499e]"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
