"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { apiClient } from "@/lib/api";
import Link from "next/link";

/**
 * Interface for GSTR-1 B2B invoice data
 */
interface GSTR1B2BInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  customerGSTIN: string;
  customerName: string;
  placeOfSupply: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
}

/**
 * Interface for GSTR-1 B2C invoice data
 */
interface GSTR1B2CInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
}

/**
 * Interface for GSTR-1 report data
 */
interface GSTR1Data {
  b2bInvoices: GSTR1B2BInvoice[];
  b2cInvoices: GSTR1B2CInvoice[];
  summary: {
    totalB2BInvoices: number;
    totalB2CInvoices: number;
    totalB2BTaxableValue: number;
    totalB2CTaxableValue: number;
    totalCGST: number;
    totalSGST: number;
    totalIGST: number;
    totalGST: number;
    totalAmount: number;
  };
}

/**
 * GSTR-1 Report Page Component
 * Displays outward supplies for GST return filing
 */
export default function GSTR1ReportPage() {
  const { trackButton, track, events } = useAnalytics(
    "GSTR1 Report Page",
    true
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gstr1Data, setGstr1Data] = useState<GSTR1Data | null>(null);
  const [activeTab, setActiveTab] = useState<"b2b" | "b2c">("b2b");

  /**
   * Fetches GSTR-1 report data
   */
  const fetchGSTR1Report = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await apiClient.get<GSTR1Data>(
        "/shopkeeper/reports/gstr1",
        params
      );
      setGstr1Data(response.data || null);
    } catch (err) {
      if (err instanceof Error) {
        // If endpoint doesn't exist, show helpful message
        if (err.message.includes("404") || err.message.includes("Not Found")) {
          setError(
            "GSTR-1 report endpoint not yet implemented. Backend endpoint required: GET /api/v1/shopkeeper/reports/gstr1"
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load GSTR-1 report");
      }
      setGstr1Data(null);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchGSTR1Report();
  }, [fetchGSTR1Report]);

  /**
   * Formats currency values
   */
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  /**
   * Formats date values
   */
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Exports GSTR-1 data to CSV format from backend
   */
  const handleExportCSV = async () => {
    try {
      trackButton("Export GSTR1 CSV", { location: "gstr1_report_page" });
      track(events.REPORT_EXPORTED, { report_type: "gstr1", format: "csv" });
      const params: Record<string, string> = { format: "csv" };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const blob = await apiClient.downloadFile(
        "/shopkeeper/reports/gstr1/export",
        params
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gstr1-report-${fromDate || "all"}-${
        toDate || "all"
      }.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  /**
   * Exports GSTR-1 data to JSON format from backend
   */
  const handleExportJSON = async () => {
    try {
      trackButton("Export GSTR1 JSON", { location: "gstr1_report_page" });
      track(events.REPORT_EXPORTED, { report_type: "gstr1", format: "json" });
      const params: Record<string, string> = { format: "json" };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const blob = await apiClient.downloadFile(
        "/shopkeeper/reports/gstr1/export",
        params
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gstr1-report-${fromDate || "all"}-${
        toDate || "all"
      }.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  /**
   * Exports GSTR-1 data in GST portal filing format (JSON)
   */
  const handleExportForFiling = () => {
    if (!gstr1Data) return;

    trackButton("Export GSTR1 For Filing", { location: "gstr1_report_page" });
    track(events.REPORT_EXPORTED, { report_type: "gstr1", format: "filing" });
    // GST portal GSTR-1 JSON format
    const filingData = {
      gstin: "", // Should be populated from store settings
      ret_period: fromDate
        ? `${fromDate.substring(0, 7)}` // YYYY-MM format
        : new Date().toISOString().substring(0, 7),
      b2b: gstr1Data.b2bInvoices.map((inv) => ({
        ctin: inv.customerGSTIN || "",
        inv: [
          {
            inum: inv.invoiceNumber,
            idt: inv.invoiceDate,
            val: inv.totalAmount,
            pos: inv.placeOfSupply || "",
            rchrg: "N",
            inv_typ: "R",
            itms: [
              {
                num: 1,
                itm_det: {
                  hsn_sc: "", // HSN code if available
                  qty: 1,
                  rt: ((inv.totalGST / inv.taxableValue) * 100).toFixed(2),
                  txval: inv.taxableValue,
                  iamt: inv.igst,
                  camt: inv.cgst,
                  samt: inv.sgst,
                },
              },
            ],
          },
        ],
      })),
      b2cl: gstr1Data.b2cInvoices
        .filter((inv) => inv.totalAmount >= 250000) // B2C Large invoices
        .map((inv) => ({
          pos: inv.placeOfSupply || "",
          typ: "OE",
          etin: "",
          rt: ((inv.totalGST / inv.taxableValue) * 100).toFixed(2),
          ad_amt: inv.taxableValue,
          iamt: inv.igst,
          camt: inv.cgst,
          samt: inv.sgst,
          csamt: 0,
        })),
      b2cs: gstr1Data.b2cInvoices
        .filter((inv) => inv.totalAmount < 250000) // B2C Small invoices
        .map((inv) => ({
          typ: "OE",
          pos: inv.placeOfSupply || "",
          rt: ((inv.totalGST / inv.taxableValue) * 100).toFixed(2),
          ad_amt: inv.taxableValue,
          iamt: inv.igst,
          camt: inv.cgst,
          samt: inv.sgst,
          csamt: 0,
        })),
    };

    const jsonContent = JSON.stringify(filingData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gstr1-filing-${fromDate || "all"}-${toDate || "all"}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                GSTR-1 Report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Outward supplies for GST return filing
              </p>
            </div>
            <Link
              href="/reports"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back to Reports
            </Link>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Date Range</h2>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded border border-red-200">
                {error}
              </div>
            )}
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <button
                onClick={fetchGSTR1Report}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {gstr1Data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                B2B Invoices
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {gstr1Data.summary.totalB2BInvoices}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                B2C Invoices
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {gstr1Data.summary.totalB2CInvoices}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                Total GST
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(gstr1Data.summary.totalGST)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                Total Amount
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(gstr1Data.summary.totalAmount)}
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Invoice Tables */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
              {gstr1Data && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Export as CSV"
                  >
                    📥 CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Export as JSON"
                  >
                    📥 JSON
                  </button>
                  <button
                    onClick={handleExportForFiling}
                    className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors"
                    title="Export for GST Filing"
                  >
                    📋 For Filing
                  </button>
                </div>
              )}
            </div>
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  trackButton("Switch to B2B Tab", {
                    location: "gstr1_report_page",
                  });
                  setActiveTab("b2b");
                }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "b2b"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                B2B Invoices ({gstr1Data?.b2bInvoices.length || 0})
              </button>
              <button
                onClick={() => {
                  trackButton("Switch to B2C Tab", {
                    location: "gstr1_report_page",
                  });
                  setActiveTab("b2c");
                }}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "b2c"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                B2C Invoices ({gstr1Data?.b2cInvoices.length || 0})
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading report...</p>
              </div>
            </div>
          ) : !gstr1Data ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {error || "No data available for the selected date range"}
            </div>
          ) : activeTab === "b2b" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer GSTIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Place of Supply
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxable Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CGST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SGST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IGST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gstr1Data.b2bInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No B2B invoices found
                      </td>
                    </tr>
                  ) : (
                    gstr1Data.b2bInvoices.map((invoice, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.customerGSTIN || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {invoice.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.placeOfSupply || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.taxableValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.cgst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.sgst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.igst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Place of Supply
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxable Value
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CGST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SGST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IGST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {gstr1Data.b2cInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No B2C invoices found
                      </td>
                    </tr>
                  ) : (
                    gstr1Data.b2cInvoices.map((invoice, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.placeOfSupply || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.taxableValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.cgst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.sgst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(invoice.igst)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
