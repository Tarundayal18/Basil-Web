"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Play,
  Clock,
  FileText,
  IndianRupee,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Car,
  Gauge,
  Droplet,
} from "lucide-react";
import {
  jobCardsService,
  JobCard,
  JobCardStatus,
} from "@/services/jobCards.service";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import JobCardItemsManagement from "./JobCardItemsManagement";
import InspectionChecklist from "./InspectionChecklist";
import EstimatesAndApprovals from "./EstimatesAndApprovals";

interface JobCardDetailPageProps {
  jobCardId: string;
}

export default function JobCardDetailPage({
  jobCardId,
}: JobCardDetailPageProps) {
  const router = useRouter();
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [jobCardItems, setJobCardItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchJobCard();
    fetchJobCardItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobCardId]);

  const fetchJobCard = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Debug: Log the jobCardId being requested
      console.log("Fetching job card with ID:", jobCardId);
      
      const data = await jobCardsService.getJobCard(jobCardId);
      setJobCard(data);
    } catch (err) {
      console.error("Error fetching job card:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load job card";
      setError(errorMessage);
      
      // If it's a 404 or "not found" error, provide more context
      if (errorMessage.toLowerCase().includes("not found") || errorMessage.includes("404")) {
        setError(`Job card not found. ID: ${jobCardId}. Please verify the job card exists.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchJobCardItems = async () => {
    try {
      const items = await jobCardsService.listJobCardItems(jobCardId);
      setJobCardItems(items);
    } catch (err) {
      console.error("Error fetching job card items:", err);
      // Don't set error state - items are optional
    }
  };

  const handleStatusUpdate = async (newStatus: JobCardStatus, notes?: string) => {
    try {
      setActionLoading(newStatus);
      await jobCardsService.updateJobCardStatus(jobCardId, {
        status: newStatus,
        notes,
      });
      await fetchJobCard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      setActionLoading("invoice");
      await jobCardsService.generateInvoice(jobCardId);
      alert("Invoice generation initiated. Please refresh in a moment.");
      await fetchJobCard();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    // Convert to number if it's a string or handle null/undefined
    const numAmount = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
    if (isNaN(numAmount)) return "₹0.00";
    return `₹${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading job card...</p>
        </div>
      </div>
    );
  }

  if (error || !jobCard) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push("/jobcards")}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Cards
        </button>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-800">{error || "Job card not found"}</p>
        </div>
      </div>
    );
  }

  const canStartWork =
    jobCard.status === "CREATED" || jobCard.status === "APPROVED";
  const canCompleteWork = jobCard.status === "IN_PROGRESS";
  const canApprove = jobCard.status === "QC_CHECK";
  const canCancel =
    jobCard.status !== "CLOSED" && jobCard.status !== "CANCELLED";
  const canGenerateInvoice = jobCard.status === "READY_FOR_DELIVERY" && !jobCard.invoiceId;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/jobcards")}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Cards
        </button>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {jobCard.jobCardNumber}
              </h1>
              <StatusBadge status={jobCard.status} />
              <PriorityBadge priority={jobCard.priority} />
            </div>
            <p className="text-lg text-gray-600">{jobCard.title}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        {canStartWork && (
          <button
            onClick={() => handleStatusUpdate("IN_PROGRESS")}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start Work
          </button>
        )}
        {canCompleteWork && (
          <button
            onClick={() => handleStatusUpdate("QC_CHECK")}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Work
          </button>
        )}
        {canApprove && (
          <button
            onClick={() => handleStatusUpdate("READY_FOR_DELIVERY")}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            Approve
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel this job card?")) {
                handleStatusUpdate("CANCELLED");
              }
            }}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </button>
        )}
        {canGenerateInvoice && (
          <button
            onClick={handleGenerateInvoice}
            disabled={!!actionLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            Generate Invoice
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">
                  {jobCard.customer.name}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </p>
                  <p className="text-base text-gray-900">
                    {jobCard.customer.phone}
                  </p>
                </div>
                {jobCard.customer.email && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      Email
                    </p>
                    <p className="text-base text-gray-900">
                      {jobCard.customer.email}
                    </p>
                  </div>
                )}
              </div>
              {jobCard.customer.address && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Address
                  </p>
                  <p className="text-base text-gray-900">
                    {[
                      jobCard.customer.address.street,
                      jobCard.customer.address.city,
                      jobCard.customer.address.state,
                      jobCard.customer.address.postcode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          {jobCard.vehicle && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                Service Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {jobCard.vehicle.regNo && (
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="text-base font-medium text-gray-900 uppercase">
                      {jobCard.vehicle.regNo}
                    </p>
                  </div>
                )}
                {jobCard.vehicle.make && (
                  <div>
                    <p className="text-sm text-gray-500">Make/Brand</p>
                    <p className="text-base font-medium text-gray-900">
                      {jobCard.vehicle.make}
                    </p>
                  </div>
                )}
                {jobCard.vehicle.model && (
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="text-base font-medium text-gray-900">
                      {jobCard.vehicle.model}
                    </p>
                  </div>
                )}
                {(jobCard.vehicle as any).year && (
                  <div>
                    <p className="text-sm text-gray-500">Year</p>
                    <p className="text-base text-gray-900">
                      {(jobCard.vehicle as any).year}
                    </p>
                  </div>
                )}
                {(jobCard.vehicle as any).odometer && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Gauge className="w-4 h-4" />
                      Odometer
                    </p>
                    <p className="text-base text-gray-900">
                      {(jobCard.vehicle as any).odometer.toLocaleString()} km
                    </p>
                  </div>
                )}
                {(jobCard.vehicle as any).fuelLevel && (
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Droplet className="w-4 h-4" />
                      Fuel Level
                    </p>
                    <p className="text-base text-gray-900">
                      {(jobCard.vehicle as any).fuelLevel}
                    </p>
                  </div>
                )}
                {jobCard.vehicle.vin && (
                  <div className="md:col-span-3">
                    <p className="text-sm text-gray-500">VIN</p>
                    <p className="text-base font-mono text-gray-900 uppercase text-sm">
                      {jobCard.vehicle.vin}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Service Information
            </h2>
            <div className="space-y-3">
              {jobCard.serviceType && (
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="text-base font-medium text-gray-900">
                    {jobCard.serviceType}
                  </p>
                </div>
              )}
              {jobCard.serviceDescription && (
                <div>
                  <p className="text-sm text-gray-500">Service Description</p>
                  <p className="text-base text-gray-900 whitespace-pre-wrap">
                    {jobCard.serviceDescription}
                  </p>
                </div>
              )}
              {jobCard.location && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </p>
                  <p className="text-base text-gray-900">{jobCard.location}</p>
                </div>
              )}
            </div>
          </div>

          {/* Scheduling */}
          {(jobCard.scheduledDate || jobCard.workStartedAt || jobCard.workCompletedAt) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule & Timeline
              </h2>
              <div className="space-y-3">
                {jobCard.scheduledDate && (
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className="text-base text-gray-900">
                      {formatDateOnly(jobCard.scheduledDate)}
                      {jobCard.scheduledTime && ` at ${jobCard.scheduledTime}`}
                    </p>
                  </div>
                )}
                {jobCard.workStartedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Work Started</p>
                    <p className="text-base text-gray-900">
                      {formatDate(jobCard.workStartedAt)}
                    </p>
                  </div>
                )}
                {jobCard.workCompletedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Work Completed</p>
                    <p className="text-base text-gray-900">
                      {formatDate(jobCard.workCompletedAt)}
                    </p>
                  </div>
                )}
                {jobCard.approvedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Approved At</p>
                    <p className="text-base text-gray-900">
                      {formatDate(jobCard.approvedAt)}
                      {jobCard.approvedBy && ` by ${jobCard.assignedToName || "Manager"}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {(jobCard.notes || jobCard.internalNotes) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Notes
              </h2>
              <div className="space-y-3">
                {jobCard.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Customer Notes</p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">
                      {jobCard.notes}
                    </p>
                  </div>
                )}
                {jobCard.internalNotes && (
                  <div>
                    <p className="text-sm text-gray-500">Internal Notes</p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">
                      {jobCard.internalNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <JobCardItemsManagement jobCardId={jobCardId} />
          </div>

          {/* Inspection Checklist */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Inspection Checklist
            </h2>
            <InspectionChecklist jobCardId={jobCardId} />
          </div>

          {/* Estimates & Approvals */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Estimates & Approvals
            </h2>
            <EstimatesAndApprovals 
              jobCardId={jobCardId}
              existingItems={jobCardItems}
            />
          </div>

          {/* Timeline */}
          {jobCard.timeline && jobCard.timeline.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Timeline
              </h2>
              <div className="space-y-4">
                {jobCard.timeline.map((event) => (
                  <div key={event.eventId} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {event.description}
                        </p>
                        {event.performedByName && (
                          <p className="text-sm text-gray-500">
                            by {event.performedByName}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="space-y-6">
          {/* Cost Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              Cost Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Labor Cost</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(jobCard.laborCost || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Materials Cost</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(jobCard.materialsCost || 0)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total Cost</span>
                <span className="font-bold text-lg text-gray-900">
                  {formatCurrency(jobCard.totalCost || 0)}
                </span>
              </div>
              {jobCard.estimatedCost && (
                <div className="text-sm text-gray-500">
                  Estimated: {formatCurrency(jobCard.estimatedCost)}
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          {jobCard.assignedToName && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Assignment
              </h2>
              <p className="text-base text-gray-900">
                {jobCard.assignedToName}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Information
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Created</p>
                <p className="text-gray-900">{formatDate(jobCard.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Updated</p>
                <p className="text-gray-900">{formatDate(jobCard.updatedAt)}</p>
              </div>
              {jobCard.invoiceId && (
                <div>
                  <p className="text-gray-500">Invoice ID</p>
                  <p className="text-gray-900">{jobCard.invoiceId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

