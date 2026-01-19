/**
 * Quotes List Page
 * Enterprise-grade quotes management with country-aware tax support
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import QuotesPage from "@/components/quotes/QuotesPage";
import InvoicesHubNav from "@/components/billing/InvoicesHubNav";

function QuotesContent() {
  useAnalytics("Quotes Page", true);
  return (
    <div className="space-y-6">
      <InvoicesHubNav />
      <QuotesPage />
    </div>
  );
}

export default function Quotes() {
  return (
    <ProtectedRoute>
      <QuotesContent />
    </ProtectedRoute>
  );
}
