"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import WorkspaceHubNav from "@/components/workspace/WorkspaceHubNav";
import RegisterStorePage from "@/components/RegisterStorePage";

export default function AddStoreNewClient() {
  useAnalytics("Add Store Page", true);
  return (
    <div className="space-y-6">
      <WorkspaceHubNav />
      <RegisterStorePage />
    </div>
  );
}

