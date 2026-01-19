/**
 * Customer Loyalty Page
 * View and manage loyalty points for a specific customer
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, LoyaltyPoints } from "@/services/crm.service";
import { crmEnhancedService } from "@/services/crm-enhanced.service";
import { Award, Plus, Minus, ArrowLeft, Star, Gift } from "lucide-react";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function CustomerLoyaltyPage() {
  return (
    <ProtectedRoute>
      <CustomerLoyaltyContent />
    </ProtectedRoute>
  );
}

function CustomerLoyaltyContent() {
  const params = useParams();
  const customerId = params.id as string;

  const [loyalty, setLoyalty] = useState<LoyaltyPoints | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pointsInput, setPointsInput] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [action, setAction] = useState<"add" | "redeem">("add");

  useEffect(() => {
    if (customerId) {
      loadData();
    }
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Load customer profile and loyalty in parallel
      const [loyaltyData, profileData] = await Promise.all([
        crmService.getLoyalty(customerId).catch(() => null),
        crmEnhancedService.getCustomerProfile(customerId).catch(() => null),
      ]);

      if (loyaltyData) {
        setLoyalty(loyaltyData);
      } else {
        // Initialize with zero points if no loyalty record exists
        setLoyalty({
          customerId,
          points: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          updatedAt: new Date().toISOString(),
        });
      }

      if (profileData) {
        setCustomer(profileData);
      }
    } catch (err: any) {
      console.error("Error loading loyalty:", err);
      setError(err.message || "Failed to load loyalty points");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!pointsInput) {
      setError("Please enter points to add");
      return;
    }

    const points = parseInt(pointsInput);
    if (isNaN(points) || points <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      const updated = await crmService.addLoyaltyPoints(customerId, { points });
      setLoyalty(updated);
      setPointsInput("");
      setRemark("");
      setSuccessMessage(`Added ${points} points successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
      loadData(); // Reload to get updated tier information
    } catch (err: any) {
      console.error("Error adding points:", err);
      setError(err.message || "Failed to add points");
    } finally {
      setProcessing(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!pointsInput) {
      setError("Please enter points to redeem");
      return;
    }

    const points = parseInt(pointsInput);
    if (isNaN(points) || points <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    const currentPoints = loyalty?.points || 0;
    if (currentPoints < points) {
      setError(`Insufficient points. Current balance: ${currentPoints}`);
      return;
    }

    try {
      setProcessing(true);
      setError("");
      const updated = await crmService.redeemLoyaltyPoints(customerId, { points });
      setLoyalty(updated);
      setPointsInput("");
      setRemark("");
      setSuccessMessage(`Redeemed ${points} points successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
      loadData(); // Reload to get updated tier information
    } catch (err: any) {
      console.error("Error redeeming points:", err);
      setError(err.message || "Failed to redeem points");
    } finally {
      setProcessing(false);
    }
  };

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case "PLATINUM":
        return {
          name: "Platinum",
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          borderColor: "border-purple-300",
          icon: "💎",
          benefits: ["10% cashback", "VIP support", "Exclusive offers", "Early access"],
        };
      case "GOLD":
        return {
          name: "Gold",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          borderColor: "border-yellow-300",
          icon: "🥇",
          benefits: ["5% cashback", "Priority support", "Exclusive offers"],
        };
      case "SILVER":
        return {
          name: "Silver",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-300",
          icon: "🥈",
          benefits: ["2% cashback", "Priority support"],
        };
      default:
        return {
          name: "Bronze",
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          borderColor: "border-orange-300",
          icon: "🥉",
          benefits: ["1% cashback"],
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const tier = (loyalty as any)?.tier || "BRONZE";
  const tierInfo = getTierInfo(tier);
  const currentPoints = loyalty?.points || 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/crm/customers/${customerId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Loyalty Points</h1>
            {customer && (
              <p className="text-gray-600 mt-1">
                {customer.name} ({customer.phone})
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loyalty Summary & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Points & Tier Card */}
          <div className={`rounded-lg p-6 shadow-sm border-2 ${tierInfo.borderColor} ${tierInfo.bgColor}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Current Points</p>
                <p className={`text-4xl font-bold ${tierInfo.color}`}>
                  {currentPoints.toLocaleString()}
                </p>
                <div className="mt-3">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${tierInfo.bgColor} ${tierInfo.color} border ${tierInfo.borderColor}`}>
                    <span className="text-xl">{tierInfo.icon}</span>
                    <span className="font-semibold">{tierInfo.name} Tier</span>
                  </div>
                </div>
              </div>
              <Award className={`h-12 w-12 ${tierInfo.color} opacity-60`} />
            </div>

            {/* Tier Benefits */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <p className="text-xs font-medium text-gray-700 mb-2">Tier Benefits:</p>
              <ul className="space-y-1">
                {tierInfo.benefits.map((benefit, idx) => (
                  <li key={idx} className="text-xs text-gray-700 flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            {/* Points Statistics */}
            {(loyalty?.totalEarned !== undefined || loyalty?.totalRedeemed !== undefined) && (
              <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Earned:</span>
                  <span className="font-medium text-green-600">+{(loyalty.totalEarned || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Redeemed:</span>
                  <span className="font-medium text-orange-600">-{(loyalty.totalRedeemed || 0).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Points Management Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Points</h2>
            
            {/* Action Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setAction("add")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  action === "add"
                    ? "bg-purple-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Add Points
              </button>
              <button
                onClick={() => setAction("redeem")}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  action === "redeem"
                    ? "bg-orange-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Redeem
              </button>
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
                  min="1"
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

              <button
                onClick={action === "add" ? handleAddPoints : handleRedeemPoints}
                disabled={processing || !pointsInput}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  action === "add"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-orange-600 hover:bg-orange-700"
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {action === "add" ? (
                      <>
                        <Plus className="h-5 w-5" />
                        Add Points
                      </>
                    ) : (
                      <>
                        <Minus className="h-5 w-5" />
                        Redeem Points
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tier Progress */}
          {tier !== "PLATINUM" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Next Tier</h3>
              {tier === "BRONZE" && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Silver Tier Requirements:</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>Points:</span>
                      <span className="font-medium">{currentPoints}/500</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (currentPoints / 500) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {500 - currentPoints > 0 ? `${500 - currentPoints} more points to reach Silver` : "Requirements met!"}
                    </p>
                  </div>
                </div>
              )}
              {tier === "SILVER" && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Gold Tier Requirements:</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>Points:</span>
                      <span className="font-medium">{currentPoints}/2000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (currentPoints / 2000) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {2000 - currentPoints > 0 ? `${2000 - currentPoints} more points to reach Gold` : "Requirements met!"}
                    </p>
                  </div>
                </div>
              )}
              {tier === "GOLD" && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Platinum Tier Requirements:</p>
                  <div className="space-y-1 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span>Points:</span>
                      <span className="font-medium">{currentPoints}/5000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (currentPoints / 5000) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {5000 - currentPoints > 0 ? `${5000 - currentPoints} more points to reach Platinum` : "Requirements met!"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Points History */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Points History</h2>
          <div className="text-center py-12 text-gray-500">
            <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Points history will be available soon</p>
            <p className="text-xs text-gray-400 mt-2">
              Transaction history for points earned and redeemed will be displayed here
            </p>
          </div>
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
