/**
 * Top Customers Report Page
 * Shows top customers by revenue
 */

"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, TopCustomer } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import Toast from "@/components/Toast";
import { useStore } from "@/contexts/StoreContext";
import Link from "next/link";

export default function TopCustomersPage() {
  return (
    <ProtectedRoute>
      <TopCustomersContent />
    </ProtectedRoute>
  );
}

function TopCustomersContent() {
  const { selectedStore } = useStore();
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  useEffect(() => {
    if (featureAvailable === true) {
      loadTopCustomers();
    }
  }, [limit, fromDate, toDate, featureAvailable]);

  const checkFeatureAvailability = async () => {
    const available = await isCRMFeatureAvailable("reports.topCustomers");
    setFeatureAvailable(available);
  };

  const loadTopCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.getTopCustomers(
        limit,
        fromDate || undefined,
        toDate || undefined
      );
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load top customers");
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
        featureName="Top Customers Report"
        description="View your top customers ranked by total revenue to identify your most valuable customers."
        backUrl="/crm"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Top Customers</h1>
        <p className="text-gray-600 mt-1">Customers ranked by total revenue</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
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
              onClick={loadTopCustomers}
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
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No customer data found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Order Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer, index) => (
                <tr key={customer.customerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">#{index + 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/crm/customers/${customer.customerId}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {customer.customerName || customer.customerId}
                    </Link>
                    {customer.customerName && (
                      <div className="text-xs text-gray-500 mt-1">{customer.customerId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{customer.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.orderCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{(
                        customer.totalSpent / customer.orderCount
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
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

