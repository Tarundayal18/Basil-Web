/**
 * Credit Notes List Page
 * Enterprise-grade credit notes management
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreditNotesPage from "@/components/credit-notes/CreditNotesPage";
import InvoicesHubNav from "@/components/billing/InvoicesHubNav";

function CreditNotesContent() {
  useAnalytics("Credit Notes Page", true);
  return (
    <div className="space-y-6">
      <InvoicesHubNav />
      <CreditNotesPage />
    </div>
  );
}

export default function CreditNotes() {
  return (
    <ProtectedRoute>
      <CreditNotesContent />
    </ProtectedRoute>
  );
}
