"use client";

import { Suspense } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReportsPage from "@/components/ReportsPage";

/**
 * Reports page route
 */
function ReportsContent() {
  useAnalytics("Reports Page", true);
  return <ReportsPage />;
}

export default function Reports() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        </div>
      }>
        <ReportsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
