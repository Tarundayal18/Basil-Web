"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import SubscriptionPage from "@/components/SubscriptionPage";

/**
 * Subscription page route
 * Wraps SubscriptionPage component with authentication protection
 */
function SubscriptionContent() {
  useAnalytics("Subscription Page", true);
  return <SubscriptionPage />;
}

export default function Subscription() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  );
}
