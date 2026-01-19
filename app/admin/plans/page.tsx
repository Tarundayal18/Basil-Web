"use client";

/**
 * Plan Management Page
 * Configure subscription plans and their features
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface Plan {
  id: string;
  planName: string;
  pricePerMonth: number;
  currency: string;
  trialDays: number;
  isActive: boolean;
  description?: string;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ plans: Plan[] }>("/admin/plans");
      setPlans(response.data?.plans || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load plans");
      console.error("Plans load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Plan Management</h1>
        <div className="space-x-4">
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => router.push("/admin/plans/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white rounded-lg shadow p-6 border-2 hover:border-blue-500 transition"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{plan.planName}</h3>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  plan.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {plan.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-bold text-blue-600">
                {plan.currency} {plan.pricePerMonth.toLocaleString()}
                <span className="text-lg text-gray-500">/month</span>
              </p>
            </div>
            {plan.description && (
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
            )}
            <div className="text-sm text-gray-500 mb-4">
              Trial: {plan.trialDays} days
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push(`/admin/plans/${plan.id}`)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Manage Features
              </button>
              <button
                onClick={() => router.push(`/admin/plans/${plan.id}/edit`)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

