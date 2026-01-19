"use client";

import { useState, useEffect } from "react";
import { aiService, CustomerSegmentation } from "@/services/ai.service";
import { Users, TrendingUp } from "lucide-react";

interface CustomerSegmentationWidgetProps {
  compact?: boolean;
}

export default function CustomerSegmentationWidget({ compact = false }: CustomerSegmentationWidgetProps) {
  const [segmentation, setSegmentation] = useState<CustomerSegmentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSegmentation();
  }, []);

  const fetchSegmentation = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await aiService.getCustomerSegmentation();
      setSegmentation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer segmentation");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !segmentation) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-700">Customer Segments</h3>
        </div>
        <div className="space-y-2">
          {segmentation.segments.slice(0, 3).map((segment, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="text-gray-600">{segment.name}</span>
              <span className="font-semibold text-gray-900">{segment.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Customer Segmentation</h3>
        </div>
        <button
          onClick={fetchSegmentation}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Total Customers: <span className="font-semibold text-gray-900">{segmentation.totalCustomers}</span>
        </p>
      </div>

      <div className="space-y-4">
        {segmentation.segments.map((segment, index) => {
          const percentage = (segment.count / segmentation.totalCustomers) * 100;
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{segment.name}</h4>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">{segment.count} customers</span>
                  <span className="text-sm font-semibold text-indigo-600">
                    ₹{segment.averageClv.toFixed(2)} avg CLV
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Characteristics:</p>
                <ul className="list-disc list-inside space-y-1">
                  {segment.characteristics.map((char, charIndex) => (
                    <li key={charIndex}>{char}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

