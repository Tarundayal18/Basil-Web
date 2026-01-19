"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardPage from "@/components/DashboardPage";

/**
 * Dashboard page route
 */
function DashboardContent() {
  useAnalytics("Dashboard", true);
  return <DashboardPage />;
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
