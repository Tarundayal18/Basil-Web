"use client";

import { JobCardStatus } from "@/services/jobCards.service";

interface StatusBadgeProps {
  status: JobCardStatus;
}

const statusColors: Record<JobCardStatus, string> = {
  CREATED: "bg-slate-100 text-slate-800",
  INSPECTION: "bg-blue-100 text-blue-800",
  ESTIMATE_SENT: "bg-cyan-100 text-cyan-800",
  APPROVED: "bg-green-100 text-green-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  WAITING_FOR_PARTS: "bg-orange-100 text-orange-800",
  QC_CHECK: "bg-yellow-100 text-yellow-800",
  READY_FOR_DELIVERY: "bg-teal-100 text-teal-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

