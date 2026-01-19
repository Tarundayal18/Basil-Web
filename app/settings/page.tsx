"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import SettingsPage from "@/components/SettingsPage";

/**
 * Settings page route
 */
function SettingsContent() {
  useAnalytics("Settings Page", true);
  return <SettingsPage />;
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
