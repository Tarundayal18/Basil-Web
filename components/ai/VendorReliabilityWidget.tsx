"use client";

import { useState, useEffect } from "react";
import { aiService, VendorReliability } from "@/services/ai.service";
import { TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface VendorReliabilityWidgetProps {
  vendorId: string;
  vendorName?: string;
  compact?: boolean;
}

export default function VendorReliabilityWidget({
  vendorId,
  vendorName,
  compact = false,
}: VendorReliabilityWidgetProps) {
  const [reliability, setReliability] = useState<VendorReliability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (vendorId) {
      fetchReliability();
    }
  }, [vendorId]);

  const fetchReliability = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await aiService.getVendorReliability(vendorId);
      setReliability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vendor reliability");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (error || !reliability) {
    return null; // Don't show widget if there's an error
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Vendor Reliability</h3>
            <p className="text-xs text-gray-500 mt-1">{reliability.vendorName}</p>
          </div>
          <div className={`w-16 h-16 rounded-full ${getScoreBgColor(reliability.reliabilityScore)} flex items-center justify-center`}>
            <span className={`text-xl font-bold ${getScoreColor(reliability.reliabilityScore)}`}>
              {reliability.reliabilityScore}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Vendor Reliability</h3>
        <button
          onClick={fetchReliability}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{reliability.vendorName}</h4>
        <div className="flex items-center gap-4">
          <div className={`w-20 h-20 rounded-full ${getScoreBgColor(reliability.reliabilityScore)} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${getScoreColor(reliability.reliabilityScore)}`}>
              {reliability.reliabilityScore}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            <p>Total Orders: {reliability.totalOrders}</p>
            <p>On-Time Delivery: {(reliability.onTimeDeliveryRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Quality Score</p>
          <p className="text-lg font-semibold text-gray-900">{reliability.qualityScore}/100</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Communication</p>
          <p className="text-lg font-semibold text-gray-900">{reliability.communicationScore}/100</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">On-Time Rate</p>
          <p className="text-lg font-semibold text-gray-900">{(reliability.onTimeDeliveryRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      {reliability.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Strengths
          </h4>
          <ul className="space-y-1">
            {reliability.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-green-600 mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reliability.issues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Areas for Improvement
          </h4>
          <ul className="space-y-1">
            {reliability.issues.map((issue, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-orange-600 mt-1">•</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

