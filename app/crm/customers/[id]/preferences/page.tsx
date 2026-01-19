/**
 * Customer Product Preferences Page
 * Shows customer's favorite products and purchase history
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, CustomerProductPreference } from "@/services/crm-enhanced.service";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function CustomerPreferencesPage() {
  return (
    <ProtectedRoute>
      <CustomerPreferencesContent />
    </ProtectedRoute>
  );
}

function CustomerPreferencesContent() {
  const params = useParams();
  const customerId = params.id as string;

  const [preferences, setPreferences] = useState<CustomerProductPreference[]>([]);
  const [enrichedPreferences, setEnrichedPreferences] = useState<Array<CustomerProductPreference & { productName?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    if (customerId) {
      loadPreferences();
      loadCustomer();
    }
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      const profile = await crmEnhancedService.getCustomerProfile(customerId);
      setCustomer(profile);
    } catch (err) {
      console.error("Error loading customer:", err);
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.getCustomerPreferences(customerId, 50);
      setPreferences(data);
      
      // Enrich with product names
      const enriched = await Promise.all(
        data.map(async (pref) => {
          try {
            // Try to get product name - we'll need to query products
            // For now, we'll use productId as fallback
            return {
              ...pref,
              productName: pref.productId, // Will be replaced if we can fetch product
            };
          } catch {
            return {
              ...pref,
              productName: pref.productId,
            };
          }
        })
      );
      setEnrichedPreferences(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Preferences</h1>
            {customer && (
              <p className="text-gray-600 mt-1">
                {customer.name}
                {"'"}s favorite products and purchase patterns
              </p>
            )}
            {!customer && (
              <p className="text-gray-600 mt-1">
                Customer{"'"}s favorite products and purchase patterns
              </p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : preferences.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No purchase history found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Purchased
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Purchase
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrichedPreferences.length > 0 ? enrichedPreferences.map((pref) => (
                <tr key={pref.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/products?productId=${pref.productId}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {pref.productName || pref.productId}
                    </Link>
                    {pref.productName !== pref.productId && (
                      <div className="text-xs text-gray-500 mt-1">ID: {pref.productId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pref.totalQuantityPurchased}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{pref.totalAmountSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pref.purchaseCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{pref.averagePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {pref.lastPurchaseDate
                        ? new Date(pref.lastPurchaseDate).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </td>
                </tr>
              )) : preferences.map((pref) => (
                <tr key={pref.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/products?productId=${pref.productId}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {pref.productId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pref.totalQuantityPurchased}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{pref.totalAmountSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pref.purchaseCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ₹{pref.averagePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {pref.lastPurchaseDate
                        ? new Date(pref.lastPurchaseDate).toLocaleDateString()
                        : "N/A"}
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

