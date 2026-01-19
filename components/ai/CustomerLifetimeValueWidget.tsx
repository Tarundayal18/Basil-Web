"use client";

import { useState, useEffect } from "react";
import { aiService, CustomerLifetimeValue } from "@/services/ai.service";
import { TrendingUp, Award, IndianRupee } from "lucide-react";

interface CustomerLifetimeValueWidgetProps {
  customerId: string;
  compact?: boolean;
}

export default function CustomerLifetimeValueWidget({
  customerId,
  compact = false,
}: CustomerLifetimeValueWidgetProps) {
  const [clv, setClv] = useState<CustomerLifetimeValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toNumberOrNull = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const formatMoney = (value: unknown, digits = 2) => {
    const n = toNumberOrNull(value);
    return n === null ? "—" : `₹${n.toFixed(digits)}`;
  };

  const formatNumber = (value: unknown, digits = 1) => {
    const n = toNumberOrNull(value);
    return n === null ? "—" : n.toFixed(digits);
  };

  useEffect(() => {
    if (customerId) {
      fetchClv();
    }
  }, [customerId]);

  const fetchClv = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await aiService.getCustomerLifetimeValue(customerId);
      setClv(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer lifetime value");
    } finally {
      setLoading(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case "HIGH_VALUE":
        return "bg-green-100 text-green-800 border-green-300";
      case "MEDIUM_VALUE":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "LOW_VALUE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "AT_RISK":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
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

  if (error || !clv) {
    return null; // Don't show widget if there's an error
  }

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Lifetime Value</h3>
            <p className="text-xs text-gray-500 mt-1">{clv.customerName}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-indigo-600">{formatMoney((clv as any).clv, 2)}</p>
            <span className={`text-xs px-2 py-1 rounded border ${getSegmentColor((clv as any).segment)}`}>
              {String((clv as any).segment || "UNKNOWN").replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Customer Lifetime Value</h3>
        <button
          onClick={fetchClv}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{clv.customerName}</h4>
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="w-5 h-5 text-indigo-600" />
              <span className="text-xs text-gray-600">Lifetime Value</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{formatMoney((clv as any).clv, 2)}</p>
          </div>
          <div>
            <span className={`px-3 py-1 rounded border font-medium ${getSegmentColor((clv as any).segment)}`}>
              {String((clv as any).segment || "UNKNOWN").replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Average Order Value</p>
          <p className="text-lg font-semibold text-gray-900">{formatMoney((clv as any).averageOrderValue, 2)}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Order Frequency</p>
          <p className="text-lg font-semibold text-gray-900">{formatNumber((clv as any).orderFrequency, 1)}/month</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Total Orders</p>
          <p className="text-lg font-semibold text-gray-900">{String((clv as any).totalOrders ?? "—")}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-lg font-semibold text-gray-900">{formatMoney((clv as any).totalRevenue, 2)}</p>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        <p>
          Last Order:{" "}
          {(clv as any).lastOrderDate ? new Date((clv as any).lastOrderDate).toLocaleDateString() : "N/A"}
        </p>
      </div>
    </div>
  );
}

