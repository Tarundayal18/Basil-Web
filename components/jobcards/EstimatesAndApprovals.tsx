/**
 * Estimates and Approvals Component
 * Manages estimates, sending, and approval workflow
 */

"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Plus,
  Eye,
  AlertCircle,
} from "lucide-react";
import { jobCardsService, JobCardItem } from "@/services/jobCards.service";
import CreateEstimateModal from "./CreateEstimateModal";

interface EstimatesAndApprovalsProps {
  jobCardId: string;
  readOnly?: boolean;
  existingItems?: JobCardItem[]; // Job card items to pre-populate estimate
}

type EstimateStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
type ApprovalMethod = "OTP" | "WHATSAPP" | "EMAIL" | "SIGNATURE" | "MANUAL";

interface EstimateLineItem {
  itemId: string;
  kind: "LABOR" | "PART";
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountPercentage?: number;
  baseAmount: number;
  taxAmount: number;
  totalAmount: number;
}

interface Estimate {
  estimateId: string;
  version: number;
  status: EstimateStatus;
  estimateNumber: string;
  items: EstimateLineItem[];
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  taxBreakup: Array<{
    taxRate: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  approvalMethod?: ApprovalMethod;
  approvedAt?: string;
  approvedBy?: string;
  sentAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EstimatesAndApprovals({
  jobCardId,
  readOnly = false,
  existingItems = [],
}: EstimatesAndApprovalsProps) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [latestEstimate, setLatestEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [createFromItemsLoading, setCreateFromItemsLoading] = useState(false);

  useEffect(() => {
    fetchEstimates();
  }, [jobCardId]);

  const fetchEstimates = async () => {
    try {
      setLoading(true);
      setError("");
      const [allData, latestData] = await Promise.all([
        jobCardsService.getAllEstimates(jobCardId).catch(() => ({ estimates: [] })),
        jobCardsService.getLatestEstimate(jobCardId).catch(() => ({ estimate: null })),
      ]);
      setEstimates(allData.estimates || []);
      setLatestEstimate(latestData.estimate || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimates");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEstimate = async (
    estimateId: string,
    approvalMethod: ApprovalMethod,
    customerPhone?: string,
    customerEmail?: string
  ) => {
    try {
      setActionLoading(estimateId);
      await jobCardsService.sendEstimate(jobCardId, estimateId, {
        approvalMethod,
        customerPhone,
        customerEmail,
      });
      await fetchEstimates();
      setShowSendModal(false);
      alert("Estimate sent successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send estimate");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveEstimate = async (
    estimateId: string,
    approvalMethod: ApprovalMethod,
    otp?: string,
    signature?: string
  ) => {
    try {
      setActionLoading(estimateId);
      await jobCardsService.approveEstimate(jobCardId, estimateId, {
        approvalMethod,
        otp,
        signature,
      });
      await fetchEstimates();
      alert("Estimate approved successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve estimate");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectEstimate = async (estimateId: string, reason: string) => {
    try {
      setActionLoading(estimateId);
      await jobCardsService.rejectEstimate(jobCardId, estimateId, { reason });
      await fetchEstimates();
      alert("Estimate rejected");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject estimate");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: EstimateStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      case "SENT":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "EXPIRED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getStatusIcon = (status: EstimateStatus) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "SENT":
        return <Send className="h-5 w-5 text-blue-600" />;
      case "EXPIRED":
        return <Clock className="h-5 w-5 text-gray-600" />;
      default:
        return <FileText className="h-5 w-5 text-yellow-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className="ml-2 text-gray-600">Loading estimates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Estimates & Approvals
        </h3>
        {!readOnly && (
          <div className="flex items-center space-x-2">
            {existingItems.length > 0 && (
              <button
                onClick={async () => {
                  try {
                    setCreateFromItemsLoading(true);
                    // Create estimate from approved/pending items
                    const estimateItems = existingItems
                      .filter((item) => item.status === "APPROVED" || item.status === "PENDING")
                      .map((item) => ({
                        kind: item.kind === "LABOR" ? "LABOR" as const : item.kind === "FEE" ? "PART" as const : "PART" as const,
                        name: item.name,
                        description: item.description || "",
                        quantity: item.qty,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate || 18,
                        discountPercentage: 0,
                      }));
                    
                    if (estimateItems.length === 0) {
                      alert("No approved or pending items available to create estimate");
                      return;
                    }

                    await jobCardsService.createEstimate(jobCardId, {
                      items: estimateItems,
                      expiresInDays: 7,
                    });
                    await fetchEstimates();
                    alert("Estimate created from job card items successfully");
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Failed to create estimate from items");
                  } finally {
                    setCreateFromItemsLoading(false);
                  }
                }}
                disabled={createFromItemsLoading}
                className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {createFromItemsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Create from Items</span>
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create Estimate</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Latest Estimate (Primary View) */}
      {latestEstimate && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                Estimate #{latestEstimate.estimateNumber}
              </h4>
              <p className="text-sm text-gray-500">
                Version {latestEstimate.version} • Created{" "}
                {formatDate(latestEstimate.createdAt)}
              </p>
            </div>
            <div
              className={`flex items-center space-x-2 rounded-lg border px-3 py-1 ${getStatusColor(
                latestEstimate.status
              )}`}
            >
              {getStatusIcon(latestEstimate.status)}
              <span className="font-medium">{latestEstimate.status}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-4 space-y-2">
            {latestEstimate.items.map((item) => (
              <div
                key={item.itemId}
                className="flex items-center justify-between border-b border-gray-100 py-2"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500">({item.kind})</span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                    {item.discountPercentage && item.discountPercentage > 0 && (
                      <span className="ml-2 text-red-600">
                        (-{item.discountPercentage}%)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(item.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Base: {formatCurrency(item.baseAmount)} + Tax:{" "}
                    {formatCurrency(item.taxAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(latestEstimate.subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax:</span>
              <span>{formatCurrency(latestEstimate.taxTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold text-gray-900">
              <span>Total:</span>
              <span>{formatCurrency(latestEstimate.grandTotal)}</span>
            </div>
          </div>

          {/* Tax Breakdown */}
          {latestEstimate.taxBreakup.length > 0 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h5 className="mb-2 text-sm font-medium text-gray-700">
                Tax Breakdown:
              </h5>
              {latestEstimate.taxBreakup.map((tax, idx) => (
                <div
                  key={idx}
                  className="flex justify-between text-sm text-gray-600"
                >
                  <span>GST {tax.taxRate}%:</span>
                  <span>
                    {formatCurrency(tax.taxAmount)} ({formatCurrency(tax.taxableAmount)})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {latestEstimate.notes && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h5 className="mb-2 text-sm font-medium text-gray-700">Notes:</h5>
              <p className="text-sm text-gray-600">{latestEstimate.notes}</p>
            </div>
          )}

          {/* Actions */}
          {!readOnly && (
            <div className="mt-6 flex space-x-3 border-t border-gray-200 pt-4">
              {latestEstimate.status === "DRAFT" && (
                <button
                  onClick={() => {
                    setSelectedEstimate(latestEstimate);
                    setShowSendModal(true);
                  }}
                  className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  disabled={actionLoading === latestEstimate.estimateId}
                >
                  {actionLoading === latestEstimate.estimateId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span>Send Estimate</span>
                </button>
              )}
              {latestEstimate.status === "SENT" && (
                <>
                  <button
                    onClick={() => handleApproveEstimate(latestEstimate.estimateId, "MANUAL")}
                    className="flex items-center space-x-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    disabled={actionLoading === latestEstimate.estimateId}
                  >
                    {actionLoading === latestEstimate.estimateId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (reason) {
                        handleRejectEstimate(latestEstimate.estimateId, reason);
                      }
                    }}
                    className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    disabled={actionLoading === latestEstimate.estimateId}
                  >
                    {actionLoading === latestEstimate.estimateId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>Reject</span>
                  </button>
                </>
              )}
              {latestEstimate.expiresAt && (
                <div className="ml-auto text-sm text-gray-500">
                  Expires: {formatDate(latestEstimate.expiresAt)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Estimate History */}
      {estimates.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-900">
            Estimate History
          </h4>
          <div className="space-y-3">
            {estimates
              .sort((a, b) => b.version - a.version)
              .map((estimate) => (
                <div
                  key={estimate.estimateId}
                  className="flex items-center justify-between rounded border border-gray-200 p-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">
                        {estimate.estimateNumber} (v{estimate.version})
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(estimate.grandTotal)} • {formatDate(estimate.createdAt)}
                    </p>
                  </div>
                  <div
                    className={`flex items-center space-x-2 rounded border px-3 py-1 ${getStatusColor(
                      estimate.status
                    )}`}
                  >
                    {getStatusIcon(estimate.status)}
                    <span className="text-sm font-medium">{estimate.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {!latestEstimate && estimates.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No estimates found</p>
          {!readOnly && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create First Estimate
            </button>
          )}
        </div>
      )}

      {/* Send Estimate Modal */}
      {showSendModal && selectedEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Send Estimate</h3>
            <p className="mb-4 text-sm text-gray-600">
              Estimate #{selectedEstimate.estimateNumber} will be sent to the customer.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  handleSendEstimate(selectedEstimate.estimateId, "WHATSAPP");
                }}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                disabled={actionLoading === selectedEstimate.estimateId}
              >
                {actionLoading === selectedEstimate.estimateId ? "Sending..." : "Send via WhatsApp"}
              </button>
              <button
                onClick={() => {
                  handleSendEstimate(selectedEstimate.estimateId, "EMAIL");
                }}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                disabled={actionLoading === selectedEstimate.estimateId}
              >
                {actionLoading === selectedEstimate.estimateId ? "Sending..." : "Send via Email"}
              </button>
              <button
                onClick={() => {
                  handleSendEstimate(selectedEstimate.estimateId, "MANUAL");
                }}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
                disabled={actionLoading === selectedEstimate.estimateId}
              >
                {actionLoading === selectedEstimate.estimateId ? "Sending..." : "Mark as Sent (Manual)"}
              </button>
              <button
                onClick={() => setShowSendModal(false)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                disabled={actionLoading === selectedEstimate.estimateId}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Estimate Modal */}
      <CreateEstimateModal
        jobCardId={jobCardId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchEstimates}
        existingItems={existingItems}
      />
    </div>
  );
}

