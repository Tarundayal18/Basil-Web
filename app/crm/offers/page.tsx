/**
 * Offers Management Page
 * Create and manage coupons and offers
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, Offer } from "@/services/crm-enhanced.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import Toast from "@/components/Toast";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function OffersPage() {
  return (
    <ProtectedRoute>
      <OffersContent />
    </ProtectedRoute>
  );
}

function OffersContent() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  const checkFeatureAvailability = async () => {
    try {
      const available = await isCRMFeatureAvailable("offers");
      setFeatureAvailable(available);
      if (available) {
        loadOffers();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error checking feature availability:", err);
      setFeatureAvailable(false);
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.listOffers();
      setOffers(data);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load offers";
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

  const isActive = (offer: Offer) => {
    const now = new Date().toISOString();
    return (
      offer.isActive &&
      offer.validFrom <= now &&
      offer.validUntil >= now &&
      (offer.totalUsageLimit === undefined || (offer.usageCount || 0) < offer.totalUsageLimit)
    );
  };

  // Show coming soon if feature is not available
  if (featureAvailable === false) {
    return (
      <ComingSoonFeature
        featureName="Offers & Coupons"
        description="Create and manage promotional offers, coupons, and discounts to drive sales and customer engagement."
        backUrl="/crm"
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Offers & Coupons</h1>
            <p className="text-gray-600 mt-1">Create and manage promotional offers</p>
          </div>
          <button
            onClick={() => router.push("/crm/offers/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Offer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No offers found</p>
          <button
            onClick={() => router.push("/crm/offers/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Your First Offer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{offer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">{offer.code || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{offer.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {offer.type === "PERCENTAGE"
                        ? `${offer.discountPercentage}%`
                        : offer.type === "FIXED_AMOUNT"
                        ? `₹${offer.discountAmount}`
                        : offer.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(offer.validFrom).toLocaleDateString()} -{" "}
                      {new Date(offer.validUntil).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {offer.usageCount || 0}
                      {offer.totalUsageLimit && ` / ${offer.totalUsageLimit}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        isActive(offer)
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isActive(offer) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/crm/offers/${offer.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
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

