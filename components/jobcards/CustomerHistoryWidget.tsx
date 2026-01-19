/**
 * CustomerHistoryWidget Component
 * 
 * Displays customer history intelligence during job card creation:
 * - Last visit date
 * - Total job cards
 * - Lifetime value
 * - Repeat issues flagging
 * 
 * Enterprise-grade feature for better service and upsell opportunities
 */

"use client";

import { useState, useEffect } from "react";
import { History, IndianRupee, Calendar, AlertCircle, TrendingUp } from "lucide-react";
import { jobCardsService } from "@/services/jobCards.service";

interface CustomerHistoryWidgetProps {
  customerId?: string;
  storeId: string;
  onJobCardSelect?: (jobCardId: string) => void;
}

interface CustomerAnalytics {
  totalJobCards: number;
  totalValue: number;
  averageValue: number;
  lastVisitDate: string | null;
  firstVisitDate: string | null;
  statusBreakdown: Record<string, number>;
}

export default function CustomerHistoryWidget({
  customerId,
  storeId,
  onJobCardSelect,
}: CustomerHistoryWidgetProps) {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentJobCards, setRecentJobCards] = useState<any[]>([]);

  useEffect(() => {
    if (!customerId) {
      setAnalytics(null);
      setRecentJobCards([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch analytics
        const analyticsData = await jobCardsService.getCustomerAnalytics(customerId);
        setAnalytics(analyticsData);

        // Fetch recent job cards
        const jobCardsResponse = await jobCardsService.getCustomerJobCards(customerId, {
          storeId,
          limit: 5,
        });
        setRecentJobCards(jobCardsResponse.items || []);
      } catch (err) {
        console.error("Error fetching customer history:", err);
        setError("Failed to load customer history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [customerId, storeId]);

  if (!customerId) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700">Loading customer history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">{error}</p>
      </div>
    );
  }

  if (!analytics || analytics.totalJobCards === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <History className="w-4 h-4" />
          <span>New customer - No previous visits</span>
        </div>
      </div>
    );
  }

  // Check for repeat issues (same service type in recent job cards)
  const recentServiceTypes = recentJobCards
    .map((jc) => jc.serviceType)
    .filter(Boolean);
  const hasRepeatIssues = recentServiceTypes.length > 1 && 
    new Set(recentServiceTypes).size < recentServiceTypes.length;

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Calculate days since last visit
  const daysSinceLastVisit = analytics.lastVisitDate
    ? Math.floor(
        (Date.now() - new Date(analytics.lastVisitDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Customer History</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Job Cards */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <History className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">Total Visits</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{analytics.totalJobCards}</p>
        </div>

        {/* Lifetime Value */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">Lifetime Value</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            ₹{analytics.totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Last Visit */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">Last Visit</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {formatDate(analytics.lastVisitDate)}
          </p>
          {daysSinceLastVisit !== null && (
            <p className="text-xs text-gray-500 mt-0.5">
              {daysSinceLastVisit === 0
                ? "Today"
                : daysSinceLastVisit === 1
                ? "Yesterday"
                : `${daysSinceLastVisit} days ago`}
            </p>
          )}
        </div>

        {/* Average Value */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">Avg. Value</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            ₹{analytics.averageValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Repeat Issues Warning */}
      {hasRepeatIssues && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-orange-900">Repeat Issue Detected</p>
            <p className="text-xs text-orange-700 mt-0.5">
              Customer has had similar service requests recently. Consider investigating root cause.
            </p>
          </div>
        </div>
      )}

      {/* Recent Job Cards */}
      {recentJobCards.length > 0 && (
        <div className="mt-3 pt-3 border-t border-indigo-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">Recent Job Cards</p>
          <div className="space-y-1.5">
            {recentJobCards.slice(0, 3).map((jobCard) => (
              <button
                key={jobCard.jobCardId}
                onClick={() => onJobCardSelect?.(jobCard.jobCardId)}
                className="w-full text-left bg-white rounded p-2 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {jobCard.jobCardNumber || jobCard.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(jobCard.createdAt)} • {jobCard.status}
                    </p>
                  </div>
                  {jobCard.totalCost && (
                    <p className="text-xs font-semibold text-gray-700 ml-2">
                      ₹{jobCard.totalCost.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
