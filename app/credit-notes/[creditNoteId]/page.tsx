/**
 * Credit Note Detail Page
 * Enterprise-grade credit note detail view
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreditNoteDetailPage from "@/components/credit-notes/CreditNoteDetailPage";

function CreditNoteDetailContent() {
  useAnalytics("Credit Note Detail Page", true);
  return <CreditNoteDetailPage />;
}

export default function CreditNoteDetail() {
  return (
    <ProtectedRoute>
      <CreditNoteDetailContent />
    </ProtectedRoute>
  );
}
