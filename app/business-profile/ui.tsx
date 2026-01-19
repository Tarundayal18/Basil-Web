"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import WorkspaceHubNav from "@/components/workspace/WorkspaceHubNav";
import BusinessProfilePage from "@/components/business-profile/BusinessProfilePage";

export default function BusinessProfileClient() {
  useAnalytics("Company & Invoicing Page", true);
  return (
    <div className="space-y-6">
      <WorkspaceHubNav />
      <BusinessProfilePage />
    </div>
  );
}

