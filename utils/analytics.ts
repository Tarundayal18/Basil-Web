/**
 * Analytics utility service for tracking user events and page views.
 * Integrates Mixpanel, Google Analytics, and Facebook Pixel for comprehensive analytics.
 */

import mixpanel from "mixpanel-browser";

/**
 * Flag to track if Mixpanel has been initialized
 */
let isMixpanelInitialized = false;

/**
 * Check if running on localhost
 */
function isLocalhost(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.")
  );
}

/**
 * Event names for consistent tracking across the application
 */
export const AnalyticsEvents = {
  // Authentication Events
  USER_SIGNED_UP: "User Signed Up",
  USER_LOGGED_IN: "User Logged In",
  USER_LOGGED_OUT: "User Logged Out",
  USER_LOGIN_FAILED: "User Login Failed",
  PASSWORD_RESET_REQUESTED: "Password Reset Requested",
  PASSWORD_RESET_COMPLETED: "Password Reset Completed",
  OTP_SENT: "OTP Sent",
  OTP_RESENT: "OTP Resent",
  OTP_VERIFIED: "OTP Verified",

  // Navigation Events
  PAGE_VIEWED: "Page Viewed",
  BUTTON_CLICKED: "Button Clicked",
  LINK_CLICKED: "Link Clicked",

  // Product/Inventory Events
  PRODUCT_VIEWED: "Product Viewed",
  PRODUCT_ADDED: "Product Added",
  PRODUCT_EDITED: "Product Edited",
  PRODUCT_DELETED: "Product Deleted",
  PRODUCT_SEARCHED: "Product Searched",
  PRODUCT_BULK_UPDATED: "Product Bulk Updated",
  PRODUCT_UPLOADED: "Product Uploaded",
  BARCODE_GENERATED: "Barcode Generated",
  QR_CODE_GENERATED: "QR Code Generated",

  // Order Events
  ORDER_CREATED: "Order Created",
  ORDER_VIEWED: "Order Viewed",
  ORDER_UPDATED: "Order Updated",
  ORDER_DELETED: "Order Deleted",
  ORDER_SEARCHED: "Order Searched",

  // Customer Events
  CUSTOMER_ADDED: "Customer Added",
  CUSTOMER_EDITED: "Customer Edited",
  CUSTOMER_DELETED: "Customer Deleted",
  CUSTOMER_IMPORTED: "Customer Imported",
  CUSTOMER_VIEWED: "Customer Viewed",

  // Settings Events
  SETTINGS_UPDATED: "Settings Updated",
  CATEGORY_ADDED: "Category Added",
  CATEGORY_EDITED: "Category Edited",
  CATEGORY_DELETED: "Category Deleted",
  BRAND_ADDED: "Brand Added",
  BRAND_EDITED: "Brand Edited",
  BRAND_DELETED: "Brand Deleted",
  SUPPLIER_ADDED: "Supplier Added",
  SUPPLIER_EDITED: "Supplier Edited",
  SUPPLIER_DELETED: "Supplier Deleted",

  // Store Events
  STORE_CREATED: "Store Created",
  STORE_UPDATED: "Store Updated",

  // Subscription Events
  SUBSCRIPTION_VIEWED: "Subscription Viewed",
  SUBSCRIPTION_PLAN_SELECTED: "Subscription Plan Selected",
  PAYMENT_INITIATED: "Payment Initiated",
  PAYMENT_COMPLETED: "Payment Completed",
  PAYMENT_FAILED: "Payment Failed",

  // Report Events
  REPORT_GENERATED: "Report Generated",
  REPORT_EXPORTED: "Report Exported",
  GSTR1_REPORT_VIEWED: "GSTR1 Report Viewed",
  GSTR3B_REPORT_VIEWED: "GSTR3B Report Viewed",
  HSN_REPORT_VIEWED: "HSN Report Viewed",
  REPORT_FILTERED: "Report Filtered",

  // Billing Events
  BILLING_ACCOUNT_CREATED: "Billing Account Created",
  BILLING_ACCOUNT_UPDATED: "Billing Account Updated",

  // Onboarding Events
  ONBOARDING_STARTED: "Onboarding Started",
  ONBOARDING_COMPLETED: "Onboarding Completed",
  ONBOARDING_SKIPPED: "Onboarding Skipped",

  // Error Events
  ERROR_OCCURRED: "Error Occurred",

  // Feature Usage
  FEATURE_USED: "Feature Used",
} as const;

/**
 * Properties that can be attached to analytics events
 */
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Initializes analytics services (Mixpanel, Google Analytics, and Facebook Pixel)
 * @param mixpanelToken - Mixpanel project token
 * @param gaId - Google Analytics measurement ID
 * @param fbPixelId - Facebook Pixel ID
 * @param user - Optional user object to identify the user
 */
export function initAnalytics(
  mixpanelToken?: string,
  gaId?: string,
  fbPixelId?: string,
  user?: { id: string; email?: string; name?: string }
): void {
  if (typeof window === "undefined") {
    return; // Server-side rendering
  }

  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }

  // Initialize Mixpanel
  if (mixpanelToken && mixpanel && typeof mixpanel.init === "function") {
    try {
      mixpanel.init(mixpanelToken, {
        autocapture: true,
        record_sessions_percent: 0,
        api_host: "https://api-eu.mixpanel.com",
        debug: process.env.NODE_ENV === "development",
        track_pageview: false, // We'll track pageviews manually
        persistence: "localStorage",
      });
      isMixpanelInitialized = true;

      // Identify user if provided
      if (user && typeof mixpanel.identify === "function") {
        mixpanel.identify(user.id);
        if (mixpanel.people && typeof mixpanel.people.set === "function") {
          mixpanel.people.set({
            $email: user.email,
            $name: user.name,
          });
        }
      }
    } catch (error) {
      console.error("Failed to initialize Mixpanel:", error);
      isMixpanelInitialized = false;
    }
  } else {
    isMixpanelInitialized = false;
  }

  // Initialize Facebook Pixel
  if (fbPixelId && typeof window !== "undefined") {
    try {
      const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
      if (fbq) {
        fbq("init", fbPixelId);
        if (user) {
          fbq("track", "PageView");
        }
      }
    } catch (error) {
      console.error("Failed to initialize Facebook Pixel:", error);
    }
  }

  // Google Analytics is initialized via @next/third-parties in the layout
  // We just need to track events using gtag
}

/**
 * Tracks a page view event
 * @param pageName - Name of the page being viewed
 * @param properties - Additional properties to attach to the event
 */
export function trackPageView(
  pageName: string,
  properties?: AnalyticsProperties
): void {
  if (typeof window === "undefined") {
    return;
  }

  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }

  const eventProperties = {
    page: pageName,
    url: window.location.pathname,
    ...properties,
  };

  // Track in Mixpanel
  if (
    isMixpanelInitialized &&
    mixpanel &&
    typeof mixpanel.track === "function"
  ) {
    try {
      mixpanel.track(AnalyticsEvents.PAGE_VIEWED, eventProperties);
      if (process.env.NODE_ENV === "development") {
        console.log("Mixpanel: Tracked page view", pageName);
      }
    } catch (error) {
      console.error("Failed to track page view in Mixpanel:", error);
    }
  } else if (process.env.NODE_ENV === "development") {
    console.warn(
      "Mixpanel not initialized, skipping page view tracking for:",
      pageName
    );
  }

  // Track in Google Analytics
  if (typeof window !== "undefined") {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("event", "page_view", {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...eventProperties,
      });
    }
  }

  // Track in Facebook Pixel
  if (typeof window !== "undefined") {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (fbq) {
      fbq("track", "PageView", {
        content_name: pageName,
        content_category: "page_view",
        ...eventProperties,
      });
    }
  }
}

/**
 * Tracks a custom event
 * @param eventName - Name of the event to track
 * @param properties - Properties to attach to the event
 */
export function trackEvent(
  eventName: string,
  properties?: AnalyticsProperties
): void {
  if (typeof window === "undefined") {
    return;
  }

  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }

  const eventProperties = {
    timestamp: new Date().toISOString(),
    ...properties,
  };

  // Track in Mixpanel
  if (
    isMixpanelInitialized &&
    mixpanel &&
    typeof mixpanel.track === "function"
  ) {
    try {
      mixpanel.track(eventName, eventProperties);
      if (process.env.NODE_ENV === "development") {
        console.log("Mixpanel: Tracked event", eventName, eventProperties);
      }
    } catch (error) {
      console.error("Failed to track event in Mixpanel:", error);
    }
  } else if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined"
  ) {
    console.warn(
      "Mixpanel not initialized, skipping event tracking:",
      eventName
    );
  }

  // Track in Google Analytics
  if (typeof window !== "undefined") {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("event", eventName, eventProperties);
    }
  }

  // Track in Facebook Pixel
  if (typeof window !== "undefined") {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (fbq) {
      // Map common event names to Facebook Pixel standard events
      const fbEventName = mapToFacebookPixelEvent(eventName);
      fbq("track", fbEventName, eventProperties);
    }
  }
}

/**
 * Maps custom event names to Facebook Pixel standard events
 * @param eventName - Custom event name
 * @returns Facebook Pixel standard event name or the original event name
 */
function mapToFacebookPixelEvent(eventName: string): string {
  const eventMap: Record<string, string> = {
    "User Signed Up": "CompleteRegistration",
    "User Logged In": "Login",
    "Button Clicked": "Lead",
    "Product Viewed": "ViewContent",
    "Order Created": "Purchase",
    "Payment Completed": "Purchase",
    "Payment Initiated": "InitiateCheckout",
    "Subscription Plan Selected": "InitiateCheckout",
  };

  return eventMap[eventName] || eventName;
}

/**
 * Identifies a user in analytics
 * @param userId - Unique user identifier
 * @param userProperties - Additional user properties
 */
export function identifyUser(
  userId: string,
  userProperties?: AnalyticsProperties
): void {
  if (typeof window === "undefined") {
    return;
  }

  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }

  // Identify in Mixpanel
  if (
    isMixpanelInitialized &&
    mixpanel &&
    typeof mixpanel.identify === "function"
  ) {
    try {
      mixpanel.identify(userId);
      if (
        userProperties &&
        mixpanel.people &&
        typeof mixpanel.people.set === "function"
      ) {
        mixpanel.people.set(userProperties);
      }
    } catch (error) {
      console.error("Failed to identify user in Mixpanel:", error);
    }
  }

  // Identify in Google Analytics
  if (typeof window !== "undefined") {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("set", "user_id", userId);
      if (userProperties) {
        gtag("set", "user_properties", userProperties);
      }
    }
  }

  // Identify in Facebook Pixel
  if (typeof window !== "undefined") {
    const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
    if (fbq && userProperties) {
      // Facebook Pixel uses different property names
      const fbProperties: Record<string, unknown> = {};
      if (userProperties.email) {
        fbProperties.em = userProperties.email;
      }
      if (userProperties.phone) {
        fbProperties.ph = userProperties.phone;
      }
      if (userProperties.name) {
        fbProperties.fn = userProperties.name;
      }
      if (Object.keys(fbProperties).length > 0) {
        fbq("track", "Lead", fbProperties);
      }
    }
  }
}

/**
 * Resets user identification (for logout)
 */
export function resetUser(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Skip tracking on localhost
  if (isLocalhost()) {
    return;
  }

  // Reset Mixpanel
  if (
    isMixpanelInitialized &&
    mixpanel &&
    typeof mixpanel.reset === "function"
  ) {
    try {
      mixpanel.reset();
    } catch (error) {
      console.error("Failed to reset Mixpanel:", error);
      isMixpanelInitialized = false; // Reset flag on error
    }
  }

  // Reset Google Analytics
  if (typeof window !== "undefined") {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("set", "user_id", null);
    }
  }
}

/**
 * Tracks a button click event
 * @param buttonName - Name/identifier of the button
 * @param properties - Additional properties
 */
export function trackButtonClick(
  buttonName: string,
  properties?: AnalyticsProperties
): void {
  trackEvent(AnalyticsEvents.BUTTON_CLICKED, {
    button_name: buttonName,
    ...properties,
  });
}

/**
 * Tracks a link click event
 * @param linkName - Name/identifier of the link
 * @param url - URL of the link
 * @param properties - Additional properties
 */
export function trackLinkClick(
  linkName: string,
  url: string,
  properties?: AnalyticsProperties
): void {
  trackEvent(AnalyticsEvents.LINK_CLICKED, {
    link_name: linkName,
    url,
    ...properties,
  });
}

/**
 * Tracks an error event
 * @param error - Error object or message
 * @param context - Additional context about where the error occurred
 */
export function trackError(
  error: Error | string,
  context?: AnalyticsProperties
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_message: errorMessage,
    error_stack: errorStack,
    ...context,
  });
}
