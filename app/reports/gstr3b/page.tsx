"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import GSTR3BReportPage from "@/components/reports/GSTR3BReportPage";

/**
 * GSTR-3B Report page
 */
function GSTR3BReportContent() {
  useAnalytics("GSTR3B Report Page", true);
  return <GSTR3BReportPage />;
}

export default function GSTR3BReport() {
  return (
    <ProtectedRoute>
      <GSTR3BReportContent />
    </ProtectedRoute>
  );
}
