"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { apiClient } from "@/lib/api";
import Link from "next/link";

/**
 * Interface for HSN-wise GST data
 */
interface HSNData {
  hsnCode: string;
  description: string;
  gstRate: number;
  quantity: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGST: number;
  totalAmount: number;
}

/**
 * HSN-wise GST Report Page Component
 * Displays GST summary grouped by HSN codes
 */
export default function HSNReportPage() {
  const { trackButton, track, events } = useAnalytics("HSN Report Page", true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hsnData, setHsnData] = useState<HSNData[]>([]);

  /**
   * Fetches HSN-wise GST report data
   */
  const fetchHSNReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await apiClient.get<HSNData[]>(
        "/shopkeeper/reports/hsn",
        params
      );
      setHsnData(response.data || []);
    } catch (err) {
      if (err instanceof Error) {
        // If endpoint doesn't exist, show helpful message
        if (err.message.includes("404") || err.message.includes("Not Found")) {
          setError(
            "HSN report endpoint not yet implemented. Backend endpoint required: GET /api/v1/shopkeeper/reports/hsn"
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load HSN report");
      }
      setHsnData([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchHSNReport();
  }, [fetchHSNReport]);

  /**
   * Formats currency values
   */
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  /**
   * Calculates totals from HSN data
   */
  const totals = hsnData.reduce(
    (acc, item) => ({
      quantity: acc.quantity + item.quantity,
      taxableValue: acc.taxableValue + item.taxableValue,
      cgst: acc.cgst + item.cgst,
      sgst: acc.sgst + item.sgst,
      igst: acc.igst + item.igst,
      totalGST: acc.totalGST + item.totalGST,
      totalAmount: acc.totalAmount + item.totalAmount,
    }),
    {
      quantity: 0,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalGST: 0,
      totalAmount: 0,
    }
  );

  /**
   * Exports HSN data to CSV format from backend
   */
  const handleExportCSV = async () => {
    try {
      const params: Record<string, string> = { format: "csv" };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const blob = await apiClient.downloadFile(
        "/shopkeeper/reports/hsn/export",
        params
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hsn-report-${fromDate || "all"}-${toDate || "all"}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  /**
   * Exports HSN data to JSON format from backend
   */
  const handleExportJSON = async () => {
    try {
      trackButton("Export HSN JSON", { location: "hsn_report_page" });
      track(events.REPORT_EXPORTED, { report_type: "hsn", format: "json" });
      const params: Record<string, string> = { format: "json" };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const blob = await apiClient.downloadFile(
        "/shopkeeper/reports/hsn/export",
        params
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `hsn-report-${fromDate || "all"}-${toDate || "all"}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  /**
   * Exports HSN data in GST filing format (CSV for HSN summary)
   */
  const handleExportForFiling = () => {
    if (hsnData.length === 0) return;

    // GST portal HSN summary format
    const headers = [
      "HSN",
      "RATE",
      "QTY",
      "TAXABLE_VALUE",
      "IGST",
      "CGST",
      "SGST",
      "TOTAL_TAX",
      "TOTAL_VALUE_INCL",
    ];

    const rows = hsnData.map((item) => [
      item.hsnCode || "NA",
      item.gstRate.toFixed(2),
      item.quantity.toString(),
      item.taxableValue.toFixed(2),
      item.igst.toFixed(2),
      item.cgst.toFixed(2),
      item.sgst.toFixed(2),
      item.totalGST.toFixed(2),
      item.totalAmount.toFixed(2),
    ]);

    const csvContent =
      headers.join(",") + "\n" + rows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hsn-filing-${fromDate || "all"}-${toDate || "all"}.csv`;
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
                HSN-wise GST Report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                GST summary grouped by HSN codes
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
                onClick={() => {
                  trackButton("Generate HSN Report", {
                    location: "hsn_report_page",
                  });
                  track(events.REPORT_GENERATED, {
                    report_type: "hsn",
                    from_date: fromDate,
                    to_date: toDate,
                  });
                  fetchHSNReport();
                }}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        {/* HSN Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              HSN-wise GST Summary
            </h2>
            {hsnData.length > 0 && (
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-600">Loading report...</p>
              </div>
            </div>
          ) : hsnData.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {error ? error : "No data available for the selected date range"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HSN Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GST Rate
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
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
                      Total GST
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hsnData.map((item, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.hsnCode || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.gstRate.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.taxableValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.cgst)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.sgst)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.igst)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(item.totalGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(item.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {totals.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totals.taxableValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totals.cgst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totals.sgst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totals.igst)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totals.totalGST)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(totals.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
