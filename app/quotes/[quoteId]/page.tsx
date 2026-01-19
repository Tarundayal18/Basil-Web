/**
 * Quote Detail Page
 * Enterprise-grade quote detail view with country-aware tax support
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuoteDetailPage from "@/components/quotes/QuoteDetailPage";

function QuoteDetailContent() {
  useAnalytics("Quote Detail Page", true);
  return <QuoteDetailPage />;
}

export default function QuoteDetail() {
  return (
    <ProtectedRoute>
      <QuoteDetailContent />
    </ProtectedRoute>
  );
}
