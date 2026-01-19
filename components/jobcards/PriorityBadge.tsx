"use client";

import { JobCardPriority } from "@/services/jobCards.service";

interface PriorityBadgeProps {
  priority?: JobCardPriority;
}

const priorityColors: Record<JobCardPriority, string> = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  // Default to MEDIUM if priority is not provided
  const displayPriority: JobCardPriority = priority || "MEDIUM";
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[displayPriority]}`}
    >
      {displayPriority}
    </span>
  );
}

