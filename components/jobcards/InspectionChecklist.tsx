/**
 * Inspection Checklist Component
 * Displays and manages inspection checklist for a job card
 */

"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Camera,
  Video,
  FileText,
} from "lucide-react";
import { jobCardsService } from "@/services/jobCards.service";
import CreateInspectionChecklistModal from "./CreateInspectionChecklistModal";

interface InspectionChecklistProps {
  jobCardId: string;
  readOnly?: boolean;
}

type InspectionItemStatus = "PENDING" | "PASS" | "FAIL" | "NOT_APPLICABLE";

interface InspectionItem {
  itemId: string;
  checkpointName: string;
  category?: string;
  status: InspectionItemStatus;
  technicianRemarks?: string;
  photos?: string[];
  videos?: string[];
  checkedAt?: string;
  checkedBy?: string;
}

interface InspectionChecklist {
  checklistId: string;
  checklistName: string;
  checklistVersion?: string;
  items: InspectionItem[];
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function InspectionChecklist({
  jobCardId,
  readOnly = false,
}: InspectionChecklistProps) {
  const [checklist, setChecklist] = useState<InspectionChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchChecklist();
  }, [jobCardId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await jobCardsService.getInspectionChecklist(jobCardId);
      setChecklist(data.checklist);
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        // Checklist doesn't exist yet - this is okay
        setChecklist(null);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load checklist");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    itemId: string,
    status: InspectionItemStatus
  ) => {
    try {
      setUpdatingItem(itemId);
      await jobCardsService.updateInspectionItem(jobCardId, itemId, { status });
      await fetchChecklist();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemarksUpdate = async (itemId: string, remarks: string) => {
    try {
      setUpdatingItem(itemId);
      await jobCardsService.updateInspectionItem(jobCardId, itemId, {
        technicianRemarks: remarks,
      });
      await fetchChecklist();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update remarks");
    } finally {
      setUpdatingItem(null);
    }
  };

  const getStatusColor = (status: InspectionItemStatus) => {
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-800 border-green-300";
      case "FAIL":
        return "bg-red-100 text-red-800 border-red-300";
      case "NOT_APPLICABLE":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getStatusIcon = (status: InspectionItemStatus) => {
    switch (status) {
      case "PASS":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "FAIL":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "NOT_APPLICABLE":
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group items by category
  const groupedItems = checklist?.items.reduce((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, InspectionItem[]>) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-gray-600">Loading checklist...</span>
      </div>
    );
  }

  if (error && !checklist) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No inspection checklist found</p>
          {!readOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Checklist
            </button>
          )}
        </div>
        <CreateInspectionChecklistModal
          jobCardId={jobCardId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchChecklist}
        />
      </>
    );
  }

  const completionPercentage =
    checklist.items.length > 0
      ? Math.round(
          (checklist.items.filter((item) => item.status !== "PENDING").length /
            checklist.items.length) *
            100
        )
      : 0;

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {checklist.checklistName}
          </h3>
          {checklist.checklistVersion && (
            <p className="text-sm text-gray-500">
              Version {checklist.checklistVersion}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Completion</div>
          <div className="text-2xl font-bold text-indigo-600">
            {completionPercentage}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Checklist Items by Category */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-semibold uppercase text-gray-700">
            {category}
          </h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.itemId}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="font-medium text-gray-900">
                        {item.checkpointName}
                      </h5>
                      {getStatusIcon(item.status)}
                    </div>

                    {item.technicianRemarks && (
                      <p className="mt-2 text-sm text-gray-600">
                        {item.technicianRemarks}
                      </p>
                    )}

                    {(item.photos?.length || item.videos?.length) && (
                      <div className="mt-2 flex space-x-2">
                        {item.photos?.map((photo, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-1 text-xs text-gray-500"
                          >
                            <Camera className="h-4 w-4" />
                            <span>Photo {idx + 1}</span>
                          </div>
                        ))}
                        {item.videos?.map((video, idx) => (
                          <div
                            key={idx}
                            className="flex items-center space-x-1 text-xs text-gray-500"
                          >
                            <Video className="h-4 w-4" />
                            <span>Video {idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.checkedAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        Checked: {formatDate(item.checkedAt)}
                      </p>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="ml-4 flex space-x-1">
                      {updatingItem === item.itemId ? (
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(item.itemId, "PASS")}
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              item.status === "PASS"
                                ? "bg-green-600 text-white"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            Pass
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(item.itemId, "FAIL")}
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              item.status === "FAIL"
                                ? "bg-red-600 text-white"
                                : "bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            Fail
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(item.itemId, "NOT_APPLICABLE")
                            }
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              item.status === "NOT_APPLICABLE"
                                ? "bg-gray-600 text-white"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            N/A
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {!readOnly && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Add remarks..."
                      value={item.technicianRemarks || ""}
                      onChange={(e) =>
                        handleRemarksUpdate(item.itemId, e.target.value)
                      }
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Completion Status */}
      {checklist.completedAt && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">
              Checklist completed on {formatDate(checklist.completedAt)}
            </span>
          </div>
        </div>
      )}
    </div>

    {/* Create Checklist Modal */}
    <CreateInspectionChecklistModal
      jobCardId={jobCardId}
      isOpen={showCreateModal}
      onClose={() => setShowCreateModal(false)}
      onSuccess={fetchChecklist}
    />
  </>
  );
}

