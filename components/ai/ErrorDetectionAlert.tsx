"use client";

import { useState, useEffect } from "react";
import { aiService, ErrorSummary } from "@/services/ai.service";
import { AlertTriangle, X, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ErrorDetectionAlert() {
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchErrorSummary();
  }, []);

  const fetchErrorSummary = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];

      const summary = await aiService.getErrorSummary({ startDate, endDate });
      setErrorSummary(summary);
    } catch (err) {
      console.error("Error fetching error summary:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dismissed || !errorSummary || errorSummary.totalErrors === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-600";
      case "HIGH":
        return "bg-orange-600";
      case "MEDIUM":
        return "bg-yellow-600";
      default:
        return "bg-blue-600";
    }
  };

  const topErrorType = Object.entries(errorSummary.errorsByType).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              We detected {errorSummary.totalErrors} issue{errorSummary.totalErrors !== 1 ? "s" : ""} this month
            </h3>
            {topErrorType && (
              <p className="text-xs text-gray-600 mb-2">
                Most common: {topErrorType[0].replace(/_/g, " ")} ({topErrorType[1]} occurrence{topErrorType[1] !== 1 ? "s" : ""})
              </p>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(errorSummary.errorsBySeverity).map(([severity, count]) => (
                <span
                  key={severity}
                  className={`text-xs px-2 py-1 rounded text-white ${getSeverityColor(severity)}`}
                >
                  {severity}: {count}
                </span>
              ))}
            </div>
            <Link
              href="/ai?tab=errors"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
              onClick={() => {
                // Track the click
                if (typeof window !== "undefined" && (window as any).mixpanel) {
                  (window as any).mixpanel.track("View All Errors Clicked", {
                    totalErrors: errorSummary.totalErrors,
                    location: "error_detection_alert",
                  });
                }
              }}
            >
              View all errors
              <span>→</span>
            </Link>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 ml-2"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

