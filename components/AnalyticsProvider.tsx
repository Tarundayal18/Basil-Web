/**
 * AnalyticsProvider component that initializes analytics services
 * and manages user identification based on authentication state.
 */

"use client";

import { useEffect } from "react";
import { initAnalytics, identifyUser, resetUser } from "@/utils/analytics";
import { useAuth } from "@/contexts/AuthContext";

/**
 * AnalyticsProvider initializes Mixpanel, Facebook Pixel, and manages user identification
 * @param children - Child components to render
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  // Initialize analytics on mount
  useEffect(() => {
    if (mixpanelToken || fbPixelId) {
      initAnalytics(
        mixpanelToken,
        undefined, // GA is handled by @next/third-parties
        fbPixelId,
        user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          : undefined
      );
    }
  }, [mixpanelToken, fbPixelId, user]);

  // Update user identification when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
      });
    } else if (!isAuthenticated) {
      resetUser();
    }
  }, [isAuthenticated, user]);

  return <>{children}</>;
}
