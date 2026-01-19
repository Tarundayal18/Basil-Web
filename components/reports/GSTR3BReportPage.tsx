"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useAnalytics } from "@/hooks/useAnalytics";

/**
 * Interface for GSTR-3B summary data
 */
interface GSTR3BData {
  summary: {
    // Outward taxable supplies
    outwardTaxableSupplies: number;
    outwardTaxableSuppliesCGST: number;
    outwardTaxableSuppliesSGST: number;
    outwardTaxableSuppliesIGST: number;

    // Outward exempt supplies
    outwardExemptSupplies: number;

    // Outward nil rated supplies
    outwardNilRatedSupplies: number;

    // Non-GST outward supplies
    nonGSTOutwardSupplies: number;

    // Input tax credit
    inputTaxCreditCGST: number;
    inputTaxCreditSGST: number;
    inputTaxCreditIGST: number;
    inputTaxCreditCess: number;

    // Inter-state supplies
    interStateSupplies: number;
    interStateSuppliesIGST: number;

    // Intra-state supplies
    intraStateSupplies: number;
    intraStateSuppliesCGST: number;
    intraStateSuppliesSGST: number;

    // Total output GST
    totalOutputCGST: number;
    totalOutputSGST: number;
    totalOutputIGST: number;
    totalOutputCess: number;

    // Total input credit
    totalInputCGST: number;
    totalInputSGST: number;
    totalInputIGST: number;
    totalInputCess: number;

    // Net GST payable
    netCGSTPayable: number;
    netSGSTPayable: number;
    netIGSTPayable: number;
    netCessPayable: number;

    // Total
    totalGSTPayable: number;
  };
}

/**
 * GSTR-3B Report Page Component
 * Displays monthly GST return summary
 */
export default function GSTR3BReportPage() {
  const { trackButton, track, events } = useAnalytics(
    "GSTR3B Report Page",
    true
  );
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gstr3bData, setGstr3bData] = useState<GSTR3BData | null>(null);

  /**
   * Fetches GSTR-3B report data
   */
  const fetchGSTR3BReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string> = {};
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await apiClient.get<GSTR3BData>(
        "/shopkeeper/reports/gstr3b",
        params
      );
      setGstr3bData(response.data || null);
    } catch (err) {
      if (err instanceof Error) {
        // If endpoint doesn't exist, show helpful message
        if (err.message.includes("404") || err.message.includes("Not Found")) {
          setError(
            "GSTR-3B report endpoint not yet implemented. Backend endpoint required: GET /api/v1/shopkeeper/reports/gstr3b"
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load GSTR-3B report");
      }
      setGstr3bData(null);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchGSTR3BReport();
  }, [fetchGSTR3BReport]);

  /**
   * Formats currency values
   */
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const summary = gstr3bData?.summary;

  /**
   * Exports GSTR-3B data to CSV format from backend
   */
  const handleExportCSV = async () => {
    try {
      const params: Record<string, string> = { format: "csv" };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const blob = await apiClient.downloadFile(
        "/shopkeeper/reports/gstr3b/export",
        params
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gstr3b-report-${fromDate || "all"}-${
        toDate || "all"
      }.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  /**
   * Exports GSTR-3B data to JSON format from backend
   */
  const handleExportJSON = async () => {
    try {
      trackButton("Export GSTR3B JSON", { location: "gstr3b_report_page" });
      track(events.REPORT_EXPORTED, { report_type: "gstr3b", format: "json" });
      const params: Record<string, string> = { format: "json" };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const blob = await apiClient.downloadFile(
        "/shopkeeper/reports/gstr3b/export",
        params
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gstr3b-report-${fromDate || "all"}-${
        toDate || "all"
      }.json`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  /**
   * Exports GSTR-3B data in GST portal filing format (JSON)
   */
  const handleExportForFiling = () => {
    if (!summary) return;

    trackButton("Export GSTR3B For Filing", { location: "gstr3b_report_page" });
    track(events.REPORT_EXPORTED, { report_type: "gstr3b", format: "filing" });
    // GST portal GSTR-3B JSON format
    const filingData = {
      gstin: "", // Should be populated from store settings
      ret_period: fromDate
        ? `${fromDate.substring(0, 7)}` // YYYY-MM format
        : new Date().toISOString().substring(0, 7),
      sup_details: {
        osup_det: {
          txval: summary.outwardTaxableSupplies,
          iamt: summary.outwardTaxableSuppliesIGST,
          camt: summary.outwardTaxableSuppliesCGST,
          samt: summary.outwardTaxableSuppliesSGST,
          csamt: 0,
        },
        exempted: summary.outwardExemptSupplies,
        nil_rated: summary.outwardNilRatedSupplies,
        non_gst: summary.nonGSTOutwardSupplies,
      },
      inter_sup: {
        unreg_details: [],
        comp_details: [],
        uin_details: [],
      },
      itc_elg: {
        itc_avl: {
          camt: summary.totalInputCGST,
          samt: summary.totalInputSGST,
          iamt: summary.totalInputIGST,
          csamt: summary.totalInputCess,
        },
        itc_rev: {
          camt: 0,
          samt: 0,
          iamt: 0,
          csamt: 0,
        },
        itc_net: {
          camt: summary.totalInputCGST,
          samt: summary.totalInputSGST,
          iamt: summary.totalInputIGST,
          csamt: summary.totalInputCess,
        },
        itc_inelg: {
          camt: 0,
          samt: 0,
          iamt: 0,
          csamt: 0,
        },
      },
      inward_sup: {
        isup_details: {
          txval: 0,
          iamt: 0,
          camt: 0,
          samt: 0,
          csamt: 0,
        },
      },
      intr_lt: {
        camt: summary.netCGSTPayable,
        samt: summary.netSGSTPayable,
        iamt: summary.netIGSTPayable,
        csamt: summary.netCessPayable,
      },
    };

    const jsonContent = JSON.stringify(filingData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gstr3b-filing-${fromDate || "all"}-${
      toDate || "all"
    }.json`;
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
                GSTR-3B Report
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Monthly GST return summary
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
                  trackButton("Generate GSTR3B Report", {
                    location: "gstr3b_report_page",
                  });
                  track(events.REPORT_GENERATED, {
                    report_type: "gstr3b",
                    from_date: fromDate,
                    to_date: toDate,
                  });
                  fetchGSTR3BReport();
                }}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600">Loading report...</p>
            </div>
          </div>
        ) : !summary ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            {error || "No data available for the selected date range"}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                  Total Output GST
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(
                    summary.totalOutputCGST +
                      summary.totalOutputSGST +
                      summary.totalOutputIGST
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">
                  Total Input Credit
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(
                    summary.totalInputCGST +
                      summary.totalInputSGST +
                      summary.totalInputIGST
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide mb-1">
                  Net GST Payable
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(summary.totalGSTPayable)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
                  Outward Supplies
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.outwardTaxableSupplies)}
                </div>
              </div>
            </div>

            {/* Detailed Summary Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  GSTR-3B Summary
                </h2>
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
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
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
                    {/* Outward Supplies */}
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="px-6 py-3 text-sm font-semibold text-gray-900"
                      >
                        Outward Supplies
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Outward Taxable Supplies
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(summary.outwardTaxableSuppliesCGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(summary.outwardTaxableSuppliesSGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(summary.outwardTaxableSuppliesIGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.outwardTaxableSupplies)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Outward Exempt Supplies
                      </td>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-sm text-gray-900 text-right"
                      >
                        {formatCurrency(summary.outwardExemptSupplies)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Outward Nil Rated Supplies
                      </td>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-sm text-gray-900 text-right"
                      >
                        {formatCurrency(summary.outwardNilRatedSupplies)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Non-GST Outward Supplies
                      </td>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-sm text-gray-900 text-right"
                      >
                        {formatCurrency(summary.nonGSTOutwardSupplies)}
                      </td>
                    </tr>

                    {/* Input Tax Credit */}
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="px-6 py-3 text-sm font-semibold text-gray-900"
                      >
                        Input Tax Credit
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        Input Tax Credit Available
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(summary.inputTaxCreditCGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(summary.inputTaxCreditSGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(summary.inputTaxCreditIGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(
                          summary.inputTaxCreditCGST +
                            summary.inputTaxCreditSGST +
                            summary.inputTaxCreditIGST
                        )}
                      </td>
                    </tr>

                    {/* Totals */}
                    <tr className="bg-gray-50">
                      <td
                        colSpan={5}
                        className="px-6 py-3 text-sm font-semibold text-gray-900"
                      >
                        Totals
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        Total Output GST
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.totalOutputCGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.totalOutputSGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.totalOutputIGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(
                          summary.totalOutputCGST +
                            summary.totalOutputSGST +
                            summary.totalOutputIGST
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        Total Input Credit
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.totalInputCGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.totalInputSGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                        {formatCurrency(summary.totalInputIGST)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(
                          summary.totalInputCGST +
                            summary.totalInputSGST +
                            summary.totalInputIGST
                        )}
                      </td>
                    </tr>
                    <tr className="bg-indigo-50 border-t-2 border-indigo-200">
                      <td className="px-6 py-4 text-sm font-bold text-indigo-900">
                        Net GST Payable
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-900 text-right">
                        {formatCurrency(summary.netCGSTPayable)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-900 text-right">
                        {formatCurrency(summary.netSGSTPayable)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-900 text-right">
                        {formatCurrency(summary.netIGSTPayable)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-indigo-900 text-right">
                        {formatCurrency(summary.totalGSTPayable)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
