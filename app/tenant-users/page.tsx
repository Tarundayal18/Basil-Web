"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import TenantUsersPage from "@/components/TenantUsersPage";
import WorkspaceHubNav from "@/components/workspace/WorkspaceHubNav";

/**
 * Tenant Users page route
 */
function TenantUsersContent() {
  useAnalytics("Tenant Users Page", true);
  return (
    <div className="space-y-6">
      <WorkspaceHubNav />
      <TenantUsersPage />
    </div>
  );
}

export default function TenantUsers() {
  return (
    <ProtectedRoute>
      <TenantUsersContent />
    </ProtectedRoute>
  );
}
