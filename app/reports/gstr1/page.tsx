"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import GSTR1ReportPage from "@/components/reports/GSTR1ReportPage";

/**
 * GSTR-1 Report page
 */
function GSTR1ReportContent() {
  useAnalytics("GSTR1 Report Page", true);
  return <GSTR1ReportPage />;
}

export default function GSTR1Report() {
  return (
    <ProtectedRoute>
      <GSTR1ReportContent />
    </ProtectedRoute>
  );
}
