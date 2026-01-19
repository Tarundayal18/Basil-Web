/**
 * This file contains the CategoryWiseSummary component that displays
 * a summary of products grouped by category with aggregated totals for
 * quantity, buy/sell prices, GST, and profit. It includes an export functionality
 * to download the summary as CSV.
 */

"use client";

import { useState, useEffect } from "react";
import { inventoryService } from "@/services/inventory.service";

interface CategorySummary {
  category: string;
  qty: number;
  buyIncl: number;
  buyBase: number;
  buyGST: number;
  sellIncl: number;
  sellBase: number;
  sellGST: number;
  profitIncl: number;
}

interface CategoryWiseSummaryProps {
  storeId: string;
  startDate?: string;
  endDate?: string;
}

/**
 * CategoryWiseSummary component displays aggregated product data by category.
 * @param props - Component props including storeId and optional date filters
 */
export default function CategoryWiseSummary({
  storeId,
  startDate,
  endDate,
}: CategoryWiseSummaryProps) {
  const [summary, setSummary] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  /**
   * Fetches the category-wise summary from the API.
   */
  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await inventoryService.getCategoryWiseSummary({
        storeId,
        startDate,
        endDate,
      });
      setSummary(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load category summary"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exports the category summary to CSV format.
   */
  const handleExport = () => {
    try {
      // Create CSV headers
      const headers = [
        "Category",
        "Qty",
        "Buy incl",
        "Buy base",
        "Buy GST",
        "Sell incl",
        "Sell base",
        "Sell GST",
        "Profit incl",
      ];

      // Create CSV rows
      const rows = summary.map((item) => [
        item.category,
        item.qty.toString(),
        item.buyIncl.toFixed(2),
        item.buyBase.toFixed(2),
        item.buyGST.toFixed(2),
        item.sellIncl.toFixed(2),
        item.sellBase.toFixed(2),
        item.sellGST.toFixed(2),
        item.profitIncl.toFixed(2),
      ]);

      // Combine headers and rows
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `category-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export category report"
      );
    }
  };

  /**
   * Formats a number to display with 2 decimal places.
   * @param num - The number to format
   * @returns Formatted number string
   */
  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <p className="mt-2 text-gray-600 text-sm">
          Loading category summary...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-600 text-sm">No category summary available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 mt-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center p-6 border-b border-gray-200">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Category Wise Summary
        </h2>
        <button
          onClick={handleExport}
          className="mt-4 md:mt-0 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        >
          Export Category Report
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buy incl
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buy base
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buy GST
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sell incl
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sell base
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sell GST
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit incl
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summary.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.category}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {item.qty}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.buyIncl)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.buyBase)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.buyGST)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.sellIncl)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.sellBase)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.sellGST)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                  {formatNumber(item.profitIncl)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
