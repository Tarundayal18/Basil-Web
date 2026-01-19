"use client";

import { useParams } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import JobCardDetailPage from "@/components/jobcards/JobCardDetailPage";

/**
 * Job Card detail page route
 */
export default function JobCardDetail() {
  const params = useParams();
  const jobCardId = params.jobCardId as string;
  useAnalytics("Job Card Detail Page", true);

  return (
    <ProtectedRoute>
      <JobCardDetailPage jobCardId={jobCardId} />
    </ProtectedRoute>
  );
}

