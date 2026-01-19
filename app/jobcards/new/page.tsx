"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreateJobCardPage from "@/components/jobcards/CreateJobCardPage";

/**
 * Create new job card page route
 */
function CreateJobCardContent() {
  useAnalytics("Create Job Card Page", true);
  return <CreateJobCardPage />;
}

export default function CreateJobCard() {
  return (
    <ProtectedRoute>
      <CreateJobCardContent />
    </ProtectedRoute>
  );
}

