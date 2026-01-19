"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import JobCardsPage from "@/components/jobcards/JobCardsPage";

/**
 * Job Cards list page route
 */
function JobCardsContent() {
  useAnalytics("Job Cards Page", true);
  return <JobCardsPage />;
}

export default function JobCards() {
  return (
    <ProtectedRoute>
      <JobCardsContent />
    </ProtectedRoute>
  );
}

