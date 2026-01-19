"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import HSNReportPage from "@/components/reports/HSNReportPage";

/**
 * HSN-wise GST Report page
 */
function HSNReportContent() {
  useAnalytics("HSN Report Page", true);
  return <HSNReportPage />;
}

export default function HSNReport() {
  return (
    <ProtectedRoute>
      <HSNReportContent />
    </ProtectedRoute>
  );
}
