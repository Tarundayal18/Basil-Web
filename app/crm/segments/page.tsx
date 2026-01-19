/**
 * Customer Segments Management Page
 * Create and manage dynamic customer segments
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, CustomerSegment } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import Toast from "@/components/Toast";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function SegmentsPage() {
  return (
    <ProtectedRoute>
      <SegmentsContent />
    </ProtectedRoute>
  );
}

function SegmentsContent() {
  const router = useRouter();
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  const checkFeatureAvailability = async () => {
    try {
      const available = await isCRMFeatureAvailable("segments");
      setFeatureAvailable(available);
      if (available) {
        loadSegments();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error checking feature availability:", err);
      setFeatureAvailable(false);
      setLoading(false);
    }
  };

  const loadSegments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.listSegments();
      setSegments(data);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load segments";
      // Check if it's a 404 or endpoint not found
      if (err?.response?.status === 404 || errorMessage.includes("404") || errorMessage.includes("Not Found") || errorMessage.includes("not found")) {
        setFeatureAvailable(false);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (segmentId: string) => {
    try {
      setRefreshing(segmentId);
      setError("");
      await crmEnhancedService.refreshSegment(segmentId);
      loadSegments(); // Reload to get updated customer count
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh segment");
    } finally {
      setRefreshing(null);
    }
  };

  // Show coming soon if feature is not available
  if (featureAvailable === false) {
    return (
      <ComingSoonFeature
        featureName="Customer Segments"
        description="Create and manage dynamic customer segments to target specific groups of customers for campaigns and offers."
        backUrl="/crm"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Segments</h1>
            <p className="text-gray-600 mt-1">Create and manage dynamic customer segments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  setRefreshing("all");
                  setError("");
                  await crmEnhancedService.autoRefreshAllSegments();
                  loadSegments();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to refresh all segments");
                } finally {
                  setRefreshing(null);
                }
              }}
              disabled={refreshing === "all"}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing === "all" ? "animate-spin" : ""}`} />
              Refresh All Dynamic
            </button>
            <button
              onClick={() => router.push("/crm/segments/new")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Segment
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : segments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No segments found</p>
          <button
            onClick={() => router.push("/crm/segments/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Segment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => (
            <div key={segment.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{segment.name}</h3>
                  {segment.description && (
                    <p className="text-sm text-gray-600 mt-1">{segment.description}</p>
                  )}
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    segment.isDynamic
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {segment.isDynamic ? "Dynamic" : "Static"}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Customers</span>
                  <span className="font-medium text-gray-900">
                    {segment.customerCount || 0}
                  </span>
                </div>
                {segment.lastUpdated && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-gray-900">
                      {new Date(segment.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRefresh(segment.id)}
                  disabled={refreshing === segment.id}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing === segment.id ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => router.push(`/crm/segments/${segment.id}`)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
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

