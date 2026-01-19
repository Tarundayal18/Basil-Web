/**
 * Peak Sales Hours Report Page
 * Shows sales performance by hour of day
 */

"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, PeakHour } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import Toast from "@/components/Toast";

export default function PeakHoursPage() {
  return (
    <ProtectedRoute>
      <PeakHoursContent />
    </ProtectedRoute>
  );
}

function PeakHoursContent() {
  const [hours, setHours] = useState<PeakHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  useEffect(() => {
    if (featureAvailable === true) {
      loadPeakHours();
    }
  }, [fromDate, toDate, featureAvailable]);

  const checkFeatureAvailability = async () => {
    const available = await isCRMFeatureAvailable("reports.peakHours");
    setFeatureAvailable(available);
  };

  const loadPeakHours = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.getPeakHours(
        fromDate || undefined,
        toDate || undefined
      );
      setHours(data.sort((a, b) => a.hour - b.hour));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load peak hours");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking feature availability
  if (featureAvailable === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show coming soon if feature is not available
  if (featureAvailable === false) {
    return (
      <ComingSoonFeature
        featureName="Peak Sales Hours Report"
        description="Analyze sales performance by hour of day to optimize staffing and operations."
        backUrl="/crm"
      />
    );
  }

  const maxOrders = Math.max(...hours.map((h) => h.orderCount), 1);
  const maxRevenue = Math.max(...hours.map((h) => h.revenue), 1);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Peak Sales Hours</h1>
        <p className="text-gray-600 mt-1">Sales performance by hour of day</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPeakHours}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : hours.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Order Count Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Orders by Hour</h2>
            <div className="space-y-2">
              {hours.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {hour.hour}:00
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                    <div
                      className="bg-blue-600 h-8 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(hour.orderCount / maxOrders) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">{hour.orderCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Revenue by Hour</h2>
            <div className="space-y-2">
              {hours.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    {hour.hour}:00
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                    <div
                      className="bg-green-600 h-8 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(hour.revenue / maxRevenue) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">
                        ₹{hour.revenue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hour
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hours.map((hour) => (
                  <tr key={hour.hour} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{hour.hour}:00</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{hour.orderCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{hour.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />
    </div>
  );
}

