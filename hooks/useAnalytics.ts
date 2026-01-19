/**
 * React hook for easy analytics tracking in components.
 * Provides convenient methods for tracking events, page views, and user actions.
 */

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  trackPageView,
  trackEvent,
  trackButtonClick,
  trackLinkClick,
  identifyUser,
  resetUser,
  AnalyticsEvents,
  type AnalyticsProperties,
} from "@/utils/analytics";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for tracking analytics events
 * @param pageName - Optional page name for automatic page view tracking
 * @param trackOnMount - Whether to track page view on component mount (default: true)
 * @returns Object with tracking functions
 */
export function useAnalytics(pageName?: string, trackOnMount: boolean = true) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  // Track page view on mount and when pathname changes
  useEffect(() => {
    if (trackOnMount && pathname) {
      const fullPageName = pageName || pathname;
      const queryParams: AnalyticsProperties = {};

      // Add search params as properties
      searchParams?.forEach((value, key) => {
        queryParams[`query_${key}`] = value;
      });

      trackPageView(fullPageName, {
        is_authenticated: isAuthenticated,
        user_id: user?.id,
        ...queryParams,
      });
    }
  }, [pathname, searchParams, pageName, trackOnMount, isAuthenticated, user]);

  // Identify user when authenticated
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

  return {
    /**
     * Track a custom event
     * @param eventName - Name of the event
     * @param properties - Additional properties
     */
    track: (eventName: string, properties?: AnalyticsProperties) => {
      trackEvent(eventName, {
        page: pageName || pathname,
        user_id: user?.id,
        ...properties,
      });
    },

    /**
     * Track a button click
     * @param buttonName - Name of the button
     * @param properties - Additional properties
     */
    trackButton: (buttonName: string, properties?: AnalyticsProperties) => {
      trackButtonClick(buttonName, {
        page: pageName || pathname,
        user_id: user?.id,
        ...properties,
      });
    },

    /**
     * Track a link click
     * @param linkName - Name of the link
     * @param url - URL of the link
     * @param properties - Additional properties
     */
    trackLink: (
      linkName: string,
      url: string,
      properties?: AnalyticsProperties
    ) => {
      trackLinkClick(linkName, url, {
        page: pageName || pathname,
        user_id: user?.id,
        ...properties,
      });
    },

    /**
     * Track a page view
     * @param customPageName - Optional custom page name
     * @param properties - Additional properties
     */
    trackPage: (customPageName?: string, properties?: AnalyticsProperties) => {
      trackPageView(customPageName || pageName || pathname, {
        user_id: user?.id,
        ...properties,
      });
    },

    /**
     * Pre-defined event names for convenience
     */
    events: AnalyticsEvents,
  };
}
