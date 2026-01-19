"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, LoyaltyPoints } from "@/services/crm.service";
import { customersService } from "@/services/customers.service";
import { Award, Plus, Minus, Search } from "lucide-react";
import Toast from "@/components/Toast";

function LoyaltyPageContent() {
  const { selectedStore } = useStore();
  const { track } = useAnalytics("Loyalty Management", true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (selectedStore?.id && searchQuery.length >= 1) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchQuery, selectedStore]);

  const searchCustomers = async () => {
    if (!selectedStore?.id) return;

    try {
      const response = await customersService.getCustomers({
        storeId: selectedStore.id,
        search: searchQuery,
        limit: 10,
      });
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Error searching customers:", err);
    }
  };

  const loadLoyalty = async (customerId: string) => {
    try {
      setLoading(true);
      setError("");
      const data = await crmService.getLoyalty(customerId);
      setLoyalty(data);
    } catch (err: any) {
      console.error("Error loading loyalty:", err);
      setError(err.message || "Failed to load loyalty points");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!selectedCustomer || !pointsInput) {
      setError("Please enter points to add");
      return;
    }

    const points = parseInt(pointsInput);
    if (isNaN(points) || points <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const updated = await crmService.addLoyaltyPoints(selectedCustomer.id, {
        points,
      });
      setLoyalty(updated);
      setPointsInput("");
      setRemark("");
      setSuccessMessage(`Added ${points} points successfully`);
      track("loyalty_points_added", {
        customerId: selectedCustomer.id,
        points,
      });
    } catch (err: any) {
      console.error("Error adding points:", err);
      setError(err.message || "Failed to add points");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!selectedCustomer || !pointsInput) {
      setError("Please enter points to redeem");
      return;
    }

    const points = parseInt(pointsInput);
    if (isNaN(points) || points <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const updated = await crmService.redeemLoyaltyPoints(selectedCustomer.id, {
        points,
      });
      setLoyalty(updated);
      setPointsInput("");
      setRemark("");
      setSuccessMessage(`Redeemed ${points} points successfully`);
      track("loyalty_points_redeemed", {
        customerId: selectedCustomer.id,
        points,
      });
    } catch (err: any) {
      console.error("Error redeeming points:", err);
      setError(err.message || "Failed to redeem points");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to manage loyalty.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Management</h1>
        <p className="text-gray-600">
          Manage customer loyalty points, rewards, and redemptions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Customer</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {customers.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    loadLoyalty(customer.id);
                    setSearchQuery("");
                    setCustomers([]);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Loyalty Points Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedCustomer ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              </div>

              {loading && !loyalty ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                </div>
              ) : loyalty ? (
                <>
                  <div className="bg-purple-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current Points</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {loyalty.points.toLocaleString()}
                        </p>
                        {(loyalty as any).tier && (
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              (loyalty as any).tier === "PLATINUM" ? "bg-purple-200 text-purple-800" :
                              (loyalty as any).tier === "GOLD" ? "bg-yellow-200 text-yellow-800" :
                              (loyalty as any).tier === "SILVER" ? "bg-gray-200 text-gray-800" :
                              "bg-orange-200 text-orange-800"
                            }`}>
                              {(loyalty as any).tier} Tier
                            </span>
                          </div>
                        )}
                      </div>
                      <Award className="h-12 w-12 text-purple-400" />
                    </div>
                    {(loyalty as any).tierBenefits && (loyalty as any).tierBenefits.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Tier Benefits:</p>
                        <ul className="space-y-1">
                          {(loyalty as any).tierBenefits.map((benefit: string, idx: number) => (
                            <li key={idx} className="text-xs text-gray-600 flex items-start">
                              <span className="text-purple-500 mr-1">•</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {loyalty.totalEarned !== undefined && (
                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Earned:</span>
                          <span className="font-medium">{loyalty.totalEarned}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">Total Redeemed:</span>
                          <span className="font-medium">{loyalty.totalRedeemed || 0}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Points
                      </label>
                      <input
                        type="number"
                        value={pointsInput}
                        onChange={(e) => setPointsInput(e.target.value)}
                        placeholder="Enter points"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remark (Optional)
                      </label>
                      <input
                        type="text"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Enter remark"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleAddPoints}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-5 w-5" />
                        Add Points
                      </button>
                      <button
                        onClick={handleRedeemPoints}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="h-5 w-5" />
                        Redeem
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Search and select a customer to manage loyalty points</p>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />
      <Toast
        message={successMessage}
        type="success"
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage("")}
      />
    </div>
  );
}

export default function LoyaltyPage() {
  return (
    <ProtectedRoute>
      <LoyaltyPageContent />
    </ProtectedRoute>
  );
}

