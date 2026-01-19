/**
 * Sentry Error Tracking Configuration
 * Provides error tracking for frontend React/Next.js application
 * 
 * Uses @sentry/react for Next.js 16 compatibility (since @sentry/nextjs doesn't support Next.js 16 yet)
 */

// Use @sentry/react which is compatible with Next.js 16
// This will be tree-shaken if Sentry is not configured
let Sentry: typeof import("@sentry/react") | null = null;
let sentryInitialized = false;
let sentryLoading = false;

/**
 * Lazy load Sentry module (client-side only)
 * This ensures proper Next.js webpack bundling
 */
async function loadSentry() {
  if (typeof window === "undefined") {
    return null;
  }

  // Check if Sentry DSN is configured
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return null;
  }

  // Prevent multiple simultaneous loads
  if (sentryLoading) {
    return null;
  }

  if (Sentry) {
    return Sentry;
  }

  try {
    sentryLoading = true;
    // Use @sentry/react which is compatible with Next.js 16
    Sentry = await import("@sentry/react");
    return Sentry;
  } catch (error) {
    console.error("❌ Failed to load Sentry:", error);
    return null;
  } finally {
    sentryLoading = false;
  }
}

/**
 * Initialize Sentry for error tracking
 * Only initializes if NEXT_PUBLIC_SENTRY_DSN is set
 */
export function initSentry() {
  // Only initialize in browser (not during SSR)
  if (typeof window === "undefined") {
    return;
  }

  // Check if Sentry DSN is configured
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn("⚠️ Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  // Load and initialize Sentry
  loadSentry()
    .then((SentryModule) => {
      if (!SentryModule) {
        return;
      }

      try {
        SentryModule.init({
          dsn,
          environment: process.env.NODE_ENV || "development",
          // Capture 100% of transactions for performance monitoring
          tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
          // Capture 100% of sessions for replay
          replaysSessionSampleRate: 0.1,
          // Capture 100% of sessions with errors for replay
          replaysOnErrorSampleRate: 1.0,
          // Configure which integrations to use
          // @sentry/react includes integrations automatically
          // We configure replay if available
          integrations: [
            // Replay for session replay (if available in @sentry/react)
            ...(SentryModule.replayIntegration ? [
              SentryModule.replayIntegration({
                // Mask all text content and user input
                maskAllText: true,
                blockAllMedia: true,
              })
            ] : []),
            // Browser tracing for performance monitoring (automatically included in @sentry/react)
          ],
          // Set release version
          release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
          // Filter out localhost errors in development
          beforeSend(event, hint) {
            // Don't send errors in development unless explicitly enabled
            if (
              process.env.NODE_ENV === "development" &&
              !process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV
            ) {
              console.log("Sentry error (not sent in dev):", event);
              return null;
            }
            return event;
          },
        });

        sentryInitialized = true;
        console.log("✅ Sentry initialized for error tracking");
      } catch (error) {
        console.error("❌ Failed to initialize Sentry:", error);
      }
    })
    .catch((error) => {
      console.error("❌ Failed to load Sentry:", error);
    });
}

/**
 * Capture an exception/error with Sentry
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (typeof window === "undefined") {
    console.error("Error (client-side only):", error, context);
    return;
  }

  // Try to use Sentry if available, otherwise just log
  if (Sentry && sentryInitialized) {
    try {
      Sentry.captureException(error, {
        extra: context,
      });
    } catch (err) {
      console.error("Failed to capture exception in Sentry:", err);
    }
  } else {
    console.error("Error (Sentry not initialized):", error, context);
  }
}

/**
 * Capture a message with Sentry
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: Record<string, any>
) {
  if (typeof window === "undefined") {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  // Try to use Sentry if available, otherwise just log
  if (Sentry && sentryInitialized) {
    try {
      Sentry.captureMessage(message, {
        level,
        extra: context,
      });
    } catch (err) {
      console.error("Failed to capture message in Sentry:", err);
    }
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}

/**
 * Set user context for Sentry (for identifying users in error reports)
 */
export function setUser(userId: string, email?: string, name?: string) {
  if (typeof window === "undefined") {
    return;
  }

  // Ensure Sentry is loaded before setting user
  if (!Sentry) {
    loadSentry().then((SentryModule) => {
      if (SentryModule && sentryInitialized) {
        try {
          SentryModule.setUser({
            id: userId,
            email,
            username: name,
          });
        } catch (err) {
          console.error("Failed to set Sentry user:", err);
        }
      }
    });
    return;
  }

  if (sentryInitialized) {
    try {
      Sentry.setUser({
        id: userId,
        email,
        username: name,
      });
    } catch (err) {
      console.error("Failed to set Sentry user:", err);
    }
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  if (typeof window === "undefined") {
    return;
  }

  if (Sentry && sentryInitialized) {
    try {
      Sentry.setUser(null);
    } catch (err) {
      console.error("Failed to clear Sentry user:", err);
    }
  }
}

/**
 * Add breadcrumb for debugging (tracks user actions leading to errors)
 */
export function addBreadcrumb(
  message: string,
  category: string = "custom",
  level: "info" | "warning" | "error" = "info",
  data?: Record<string, any>
) {
  if (typeof window === "undefined") {
    return;
  }

  // Ensure Sentry is loaded before adding breadcrumb
  if (!Sentry) {
    loadSentry().then((SentryModule) => {
      if (SentryModule && sentryInitialized) {
        try {
          SentryModule.addBreadcrumb({
            message,
            category,
            level,
            data,
            timestamp: Date.now() / 1000,
          });
        } catch (err) {
          console.error("Failed to add Sentry breadcrumb:", err);
        }
      }
    });
    return;
  }

  if (sentryInitialized) {
    try {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (err) {
      console.error("Failed to add Sentry breadcrumb:", err);
    }
  }
}
