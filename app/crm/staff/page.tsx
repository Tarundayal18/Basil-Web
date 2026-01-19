"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, StaffPerformance } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import { TrendingUp, Users, Clock, Star } from "lucide-react";
import Toast from "@/components/Toast";

function StaffPerformancePageContent() {
  const { selectedStore } = useStore();
  const { track } = useAnalytics("Staff Performance", true);
  const [loading, setLoading] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [period, setPeriod] = useState("");
  const [performance, setPerformance] = useState<StaffPerformance | null>(null);
  const [error, setError] = useState("");
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setPeriod(currentPeriod);
    checkFeatureAvailability();
  }, []);

  const checkFeatureAvailability = async () => {
    try {
      const available = await isCRMFeatureAvailable("staff");
      setFeatureAvailable(available);
    } catch (err) {
      console.error("Error checking feature availability:", err);
      setFeatureAvailable(false);
    }
  };

  const loadPerformance = async () => {
    if (!staffId) {
      setError("Please enter a staff ID");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.getStaffPerformance(staffId, period);
      setPerformance(data);
      track("staff_performance_viewed", {
        staffId,
        period,
      });
    } catch (err: any) {
      console.error("Error loading staff performance:", err);
      const errorMessage = err.message || "Failed to load staff performance";
      // Check if it's a 404 or endpoint not found
      if (err?.response?.status === 404 || errorMessage.includes("404") || errorMessage.includes("Not Found") || errorMessage.includes("not found")) {
        setFeatureAvailable(false);
      } else {
        setError(errorMessage);
        setPerformance(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show coming soon if feature is not available
  if (featureAvailable === false) {
    return (
      <ComingSoonFeature
        featureName="Staff Performance"
        description="Track and analyze staff sales and service performance metrics to optimize team productivity."
        backUrl="/crm"
      />
    );
  }

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to view staff performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Performance</h1>
        <p className="text-gray-600">
          Track and analyze staff sales and service performance metrics
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff ID
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="Enter staff ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period (YYYY-MM)
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="2025-01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPerformance}
              disabled={loading || !staffId}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Load Performance"}
            </button>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : performance ? (
        <div className="space-y-6">
          {/* Sales Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Sales Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{performance.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Order Count</p>
                <p className="text-2xl font-bold text-green-600">
                  {performance.orderCount}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{performance.averageOrderValue.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {performance.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Upsell Count</p>
                <p className="text-2xl font-bold text-pink-600">
                  {performance.upsellCount}
                </p>
              </div>
            </div>
          </div>

          {/* Service Metrics */}
          {performance.serviceCount !== undefined && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Service Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-teal-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Service Count</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {performance.serviceCount}
                  </p>
                </div>
                {performance.averageResolutionTime !== undefined && (
                  <div className="bg-cyan-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Avg Resolution Time</p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {performance.averageResolutionTime} min
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Satisfaction */}
          {performance.averageRating !== undefined && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-indigo-600" />
                Customer Satisfaction
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {performance.averageRating.toFixed(1)} ⭐
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Review Count</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {performance.reviewCount || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Period Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Period:</span>
              <span className="font-medium text-gray-900">{performance.period}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Store ID:</span>
              <span className="font-medium text-gray-900">{performance.storeId}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Enter a staff ID and period to view performance metrics</p>
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

export default function StaffPerformancePage() {
  return (
    <ProtectedRoute>
      <StaffPerformancePageContent />
    </ProtectedRoute>
  );
}

