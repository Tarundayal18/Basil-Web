"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import TenantRolesPage from "@/components/TenantRolesPage";
import WorkspaceHubNav from "@/components/workspace/WorkspaceHubNav";

/**
 * Tenant Roles page route
 */
function TenantRolesContent() {
  useAnalytics("Tenant Roles Page", true);
  return (
    <div className="space-y-6">
      <WorkspaceHubNav />
      <TenantRolesPage />
    </div>
  );
}

export default function TenantRoles() {
  return (
    <ProtectedRoute>
      <TenantRolesContent />
    </ProtectedRoute>
  );
}
