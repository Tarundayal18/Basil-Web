"use client";

import { useState, useEffect } from "react";
import { scannedBillsService, ScannedBill } from "@/services/scannedBills.service";
import { useStore } from "@/contexts/StoreContext";
import UploadBillModal from "./UploadBillModal";
import ScannedBillDetailModal from "./ScannedBillDetailModal";
import Toast from "../Toast";
import Snackbar from "../Snackbar";
import { ScanLine, Upload, Search, Filter, AlertCircle } from "lucide-react";

export default function ScannedBillsPage() {
  const { selectedStore, loading: storeLoading } = useStore();
  const [bills, setBills] = useState<ScannedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<ScannedBill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (selectedStore?.id) {
      fetchBills();
    } else if (selectedStore === null && !loading) {
      setError("No store selected. Please select a store to view scanned bills.");
    }
  }, [selectedStore, statusFilter, supplierFilter, startDate, endDate]);

  const fetchBills = async () => {
    if (!selectedStore?.id) {
      setError("No store selected. Please select a store from the store selector.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const params: any = {
        storeId: selectedStore.id, // Include storeId to ensure correct store is queried
      };
      if (supplierFilter) params.supplierName = supplierFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      params.limit = 50;

      const result = await scannedBillsService.getScannedBills(params);
      let filteredBills = result.bills;

      // Apply status filter
      if (statusFilter !== "all") {
        filteredBills = filteredBills.filter((bill) => {
          const billStatus = bill.status.toUpperCase();
          const filterStatus = statusFilter.toUpperCase();
          
          // Map status filter to actual status values
          if (filterStatus === "PENDING") {
            return billStatus === "PENDING" || billStatus === "PARSING";
          }
          if (filterStatus === "PARSED") {
            return billStatus === "PARSED";
          }
          if (filterStatus === "PARSED_NEEDS_CONFIRMATION") {
            return billStatus === "PARSED_NEEDS_CONFIRMATION";
          }
          return billStatus === filterStatus;
        });
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredBills = filteredBills.filter(
          (bill) =>
            bill.supplierName?.toLowerCase().includes(searchLower) ||
            bill.invoiceNumber?.toLowerCase().includes(searchLower) ||
            bill.id.toLowerCase().includes(searchLower)
        );
      }

      setBills(filteredBills);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load scanned bills"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBillClick = (bill: ScannedBill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const handleProcessSuccess = () => {
    setSuccessMessage("Bill processed successfully! Products have been added to inventory.");
    setShowDetailModal(false);
    setSelectedBill(null);
    fetchBills();
    
    // Dispatch custom event to notify other components (like InventoryPage) to refresh
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("productsUpdated", { 
        detail: { source: "scannedBill" } 
      }));
    }
  };

  const getStatusBadge = (bill: ScannedBill) => {
    const status = bill.status;
    const statusColors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PARSED: "bg-blue-100 text-blue-800",
      PARSED_NEEDS_CONFIRMATION: "bg-orange-100 text-orange-800",
      PROCESSED: "bg-green-100 text-green-800",
      DUPLICATE: "bg-orange-100 text-orange-800",
      FAILED: "bg-red-100 text-red-800",
      OCR_FAILED: "bg-red-100 text-red-800",
    };

    let statusLabel: string = status;
    if (status === "PARSED_NEEDS_CONFIRMATION") {
      statusLabel = "Needs Confirmation";
    } else if (status === "PARSED") {
      statusLabel = "Ready to Process";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          statusColors[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {statusLabel}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Scanned Bills
            </h1>
            <p className="text-gray-600 mt-1">
              Upload and manage supplier purchase invoices
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Bill
          </button>
        </div>
      </div>

      {error && (
        <Snackbar
          message={error}
          type="error"
          isOpen={!!error}
          onClose={() => setError("")}
          duration={6000}
        />
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by supplier or invoice..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARSED">Ready to Process</option>
            <option value="PARSED_NEEDS_CONFIRMATION">Needs Confirmation</option>
            <option value="PROCESSED">Processed</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="FAILED">Failed</option>
            <option value="OCR_FAILED">OCR Failed</option>
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
            min={startDate || undefined}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Store Selection Error */}
      {!storeLoading && !selectedStore?.id && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">No store selected</p>
          <p className="text-sm mt-1">
            Please select a store from the store selector in the header to view and manage scanned bills.
          </p>
        </div>
      )}

      {/* Bills List */}
      {loading || storeLoading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading scanned bills...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <ScanLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No scanned bills found</p>
          <p className="text-gray-500 text-sm mb-6">
            Upload a supplier invoice to get started
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Upload Your First Bill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <div
              key={bill.id}
              onClick={() => handleBillClick(bill)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {bill.supplierName || "Unknown Supplier"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Invoice: {bill.invoiceNumber || "N/A"}
                  </p>
                  {bill.duplicateOf && (
                    <p className="text-xs text-orange-600 mt-1">
                      Duplicate of bill {bill.duplicateOf.substring(0, 8)}...
                    </p>
                  )}
                </div>
                {getStatusBadge(bill)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="text-gray-900">
                    {bill.invoiceDate
                      ? new Date(bill.invoiceDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                {bill.totalAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="text-gray-900 font-medium">
                      ₹{bill.totalAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Items:</span>
                  <span className="text-gray-900">{bill.items.length}</span>
                </div>
                {(bill as any).requiresOwnerConfirmation && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Requires owner confirmation</span>
                  </div>
                )}
                {(bill as any).isHandwritten && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ✍️ Handwritten invoice
                  </div>
                )}
                {(bill as any).overallConfidence !== undefined && (
                  <div className="mt-2 text-xs text-gray-500">
                    Confidence: {((bill as any).overallConfidence * 100).toFixed(0)}%
                  </div>
                )}
                {bill.duplicateOf && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                    ⚠️ Duplicate of existing bill
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <UploadBillModal
          onClose={() => {
            setShowUploadModal(false);
            fetchBills();
          }}
          onSuccess={() => {
            setSuccessMessage("Bill uploaded successfully! Processing...");
            setShowUploadModal(false);
            setTimeout(() => {
              fetchBills();
              // Dispatch event to notify that a bill was uploaded (products may be added soon)
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("billUploaded", { 
                  detail: { source: "scannedBill" } 
                }));
              }
            }, 2000);
          }}
        />
      )}

      {showDetailModal && selectedBill && (
        <ScannedBillDetailModal
          bill={selectedBill}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBill(null);
          }}
          onProcessSuccess={handleProcessSuccess}
        />
      )}

      <Toast
        message={successMessage}
        type="success"
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage("")}
        duration={4000}
      />
    </div>
  );
}

