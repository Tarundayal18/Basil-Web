/**
 * Create Credit Note Page
 * Enterprise-grade credit note creation
 */

"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreateCreditNotePage from "@/components/credit-notes/CreateCreditNotePage";

function CreateCreditNoteContent() {
  useAnalytics("Create Credit Note Page", true);
  return <CreateCreditNotePage />;
}

export default function CreateCreditNote() {
  return (
    <ProtectedRoute>
      <CreateCreditNoteContent />
    </ProtectedRoute>
  );
}
