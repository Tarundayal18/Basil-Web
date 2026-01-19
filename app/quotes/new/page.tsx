/**
 * Create Quote Page
 * Enterprise-grade quote creation with country-aware tax support
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreateQuotePage from "@/components/quotes/CreateQuotePage";

function CreateQuoteContent() {
  useAnalytics("Create Quote Page", true);
  return <CreateQuotePage />;
}

export default function CreateQuote() {
  return (
    <ProtectedRoute>
      <CreateQuoteContent />
    </ProtectedRoute>
  );
}
