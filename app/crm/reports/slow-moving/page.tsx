/**
 * Slow-Moving Products Report Page
 * Shows products that haven't sold in a while
 */

"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, SlowMovingProduct } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import Toast from "@/components/Toast";

export default function SlowMovingProductsPage() {
  return (
    <ProtectedRoute>
      <SlowMovingProductsContent />
    </ProtectedRoute>
  );
}

function SlowMovingProductsContent() {
  const [products, setProducts] = useState<SlowMovingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(90);
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  useEffect(() => {
    if (featureAvailable === true) {
      loadSlowMovingProducts();
    }
  }, [days, featureAvailable]);

  const checkFeatureAvailability = async () => {
    const available = await isCRMFeatureAvailable("reports.slowMoving");
    setFeatureAvailable(available);
  };

  const loadSlowMovingProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.getSlowMovingProducts(days);
      setProducts(data || []);
    } catch (err) {
      console.error("Error loading slow-moving products:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Failed to load slow-moving products";
      setError(errorMessage);
      setProducts([]); // Clear products on error
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
        featureName="Slow-Moving Products Report"
        description="Identify products that haven't sold recently to optimize inventory and pricing strategies."
        backUrl="/crm"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Slow-Moving Products</h1>
        <p className="text-gray-600 mt-1">Products that haven't sold recently</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Days Since Last Sale
            </label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 90)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              min={1}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadSlowMovingProducts}
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
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No slow-moving products found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sold Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Since Last Sale
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const daysSince = product.lastSoldDate
                  ? Math.floor(
                      (new Date().getTime() - new Date(product.lastSoldDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null;

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{(product as any).productName || product.productId}</div>
                      {(product as any).productName && (
                        <div className="text-xs text-gray-500 mt-1">ID: {product.productId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.totalQuantitySold}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ₹{product.totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {product.lastSoldDate
                          ? new Date(product.lastSoldDate).toLocaleDateString()
                          : "Never"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {daysSince !== null ? `${daysSince} days` : "N/A"}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

