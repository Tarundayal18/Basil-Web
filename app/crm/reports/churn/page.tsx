/**
 * Churn Risk Analysis Page
 * Shows customers at risk of churning
 */

"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, ChurnRiskCustomer } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function ChurnRiskPage() {
  return (
    <ProtectedRoute>
      <ChurnRiskContent />
    </ProtectedRoute>
  );
}

function ChurnRiskContent() {
  const [customers, setCustomers] = useState<ChurnRiskCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  useEffect(() => {
    if (featureAvailable === true) {
      loadChurnRisk();
    }
  }, [days, featureAvailable]);

  const checkFeatureAvailability = async () => {
    try {
      const available = await isCRMFeatureAvailable("reports.churn");
      setFeatureAvailable(available);
      if (!available) {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error checking feature availability:", err);
      setFeatureAvailable(false);
      setLoading(false);
    }
  };

  const loadChurnRisk = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.getChurnRiskCustomers(days);
      setCustomers(data);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load churn risk customers";
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

  const getRiskColor = (score: number) => {
    if (score >= 70) return "bg-red-100 text-red-800";
    if (score >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  // Show coming soon if feature is not available
  if (featureAvailable === false) {
    return (
      <ComingSoonFeature
        featureName="Churn Risk Analysis"
        description="Identify customers at risk of churning and take proactive measures to retain them."
        backUrl="/crm"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Churn Risk Analysis</h1>
        <p className="text-gray-600 mt-1">Customers at risk of churning</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Inactive Threshold
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={1}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadChurnRisk}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No churn risk customers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Since Last Purchase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.customerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/crm/customers/${customer.customerId}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {(customer as any).customerName || customer.customerId}
                    </Link>
                    {(customer as any).customerName && (
                      <div className="text-xs text-gray-500 mt-1">{customer.customerId}</div>
                    )}
                    {(customer as any).lifetimeValue !== undefined && (
                      <div className="text-xs text-gray-500 mt-1">
                        LTV: ₹{((customer as any).lifetimeValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.daysSinceLastPurchase} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${customer.riskScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-12">{customer.riskScore}/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(
                        customer.riskScore
                      )}`}
                    >
                      {getRiskLabel(customer.riskScore)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/crm/campaigns/new?type=TRIGGER&triggerType=NO_PURCHASE_DAYS&customerId=${customer.customerId}`}
                      className="text-indigo-600 hover:text-indigo-700 mr-3"
                    >
                      Create Campaign
                    </Link>
                    <Link
                      href={`/crm/offers/new?targetCustomerId=${customer.customerId}`}
                      className="text-green-600 hover:text-green-700"
                    >
                      Create Offer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

