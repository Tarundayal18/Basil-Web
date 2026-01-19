"use client";

/**
 * Super Admin Dashboard
 * Enterprise subscription management and tenant oversight
 * 
 * Access: Users who login with Google using an admin email (registered in SystemAdmins table)
 * will have isAdmin=true in their profile and can access this page.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface DashboardStats {
  overview: {
    totalTenants: number;
    activeTenants: number;
    trialTenants: number;
    suspendedTenants: number;
    cancelledTenants: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    activePlans: number;
    mrr: number;
    totalFeatureUsage: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Please login to access admin dashboard");
        setCheckingAdmin(false);
        setLoading(false);
        return;
      }

      // First check localStorage for cached admin status
      const cachedIsAdmin = localStorage.getItem("isAdmin");
      if (cachedIsAdmin === "true") {
        setIsAdmin(true);
        setCheckingAdmin(false);
        loadDashboard();
        return;
      }

      // If not cached, fetch profile to check admin status
      try {
        const profileResponse = await apiClient.get<{
          user: { isAdmin?: boolean };
        }>("/shopkeeper/profile");
        
        const adminStatus = profileResponse.data?.user?.isAdmin === true;
        setIsAdmin(adminStatus);
        
        // Always cache the admin status (even if false)
        localStorage.setItem("isAdmin", String(adminStatus));
        // Dispatch custom event for same-tab listeners (e.g., Sidebar)
        window.dispatchEvent(
          new CustomEvent("localStorageChange", {
            detail: { key: "isAdmin", newValue: String(adminStatus) },
          })
        );
        
        if (adminStatus) {
          loadDashboard();
        } else {
          setError("You do not have admin access. Please login with an admin email.");
          setLoading(false);
        }
      } catch (profileError: any) {
        console.error("Profile fetch error:", profileError);
        const errorMsg = profileError.message || profileError.response?.data?.message || "Failed to verify admin access";
        if (errorMsg.includes("Unauthorized") || errorMsg.includes("401")) {
          setError("Your email is not registered as an admin. Please contact system administrator to add your email to the SYSTEM_ADMINS_TABLE.");
        } else {
          setError(errorMsg);
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Admin check error:", err);
      setError("Failed to verify admin access");
      setLoading(false);
    } finally {
      setCheckingAdmin(false);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<DashboardStats>("/admin/dashboard");
      setStats(response.data ?? null);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || "Failed to load dashboard";
      console.error("Dashboard load error:", err);
      
      // Provide more specific error message
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401") || errorMessage.includes("403")) {
        setError("Admin access denied. Your email must be registered in the SYSTEM_ADMINS_TABLE with isActive=true. Please contact system administrator.");
        setIsAdmin(false);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg text-gray-600">
            {checkingAdmin ? "Verifying admin access..." : "Loading dashboard..."}
          </div>
        </div>
      </div>
    );
  }

  if (error || isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800">Admin Access Required</h2>
          <div className="text-red-500">{error || "You do not have admin access"}</div>
          <div className="space-y-3 pt-4">
            <p className="text-gray-600 text-sm">
              To access the admin dashboard, you need to:
            </p>
            <ol className="text-left text-sm text-gray-600 space-y-2 pl-4">
              <li>1. Login with Google using your admin email</li>
              <li>2. Your email must be registered in the admin system</li>
            </ol>
            <div className="pt-4 space-y-2">
              <button
                onClick={() => router.push("/login")}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Go to User Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {
    totalTenants: 0,
    activeTenants: 0,
    trialTenants: 0,
    suspendedTenants: 0,
    cancelledTenants: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    activePlans: 0,
    mrr: 0,
    totalFeatureUsage: 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise subscription management</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => router.push("/admin/tenants")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Manage Tenants
          </button>
          <button
            onClick={() => router.push("/admin/shopkeepers")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Manage Shopkeepers
          </button>
          <button
            onClick={() => router.push("/admin/plans")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Manage Plans
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Tenants</h3>
          <p className="text-3xl font-bold mt-2">{overview.totalTenants}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Tenants</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {overview.activeTenants}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Trial Tenants</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {overview.trialTenants}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">MRR</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            ₹{overview.mrr.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total Subscriptions
          </h3>
          <p className="text-3xl font-bold mt-2">{overview.totalSubscriptions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Active Subscriptions
          </h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {overview.activeSubscriptions}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Plans</h3>
          <p className="text-3xl font-bold mt-2">{overview.activePlans}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/admin/tenants")}
            className="p-4 border rounded hover:bg-gray-50 text-left"
          >
            <h3 className="font-semibold">Manage Tenants</h3>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all tenant accounts
            </p>
          </button>
          <button
            onClick={() => router.push("/admin/plans")}
            className="p-4 border rounded hover:bg-gray-50 text-left"
          >
            <h3 className="font-semibold">Manage Plans</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure subscription plans and features
            </p>
          </button>
          <button
            onClick={() => router.push("/admin/shopkeepers")}
            className="p-4 border rounded hover:bg-gray-50 text-left"
          >
            <h3 className="font-semibold">Manage Shopkeepers</h3>
            <p className="text-sm text-gray-500 mt-1">
              View, deactivate, and hard-delete shopkeepers
            </p>
          </button>
          <button
            onClick={() => router.push("/admin/subscriptions")}
            className="p-4 border rounded hover:bg-gray-50 text-left"
          >
            <h3 className="font-semibold">View Subscriptions</h3>
            <p className="text-sm text-gray-500 mt-1">
              Monitor all active subscriptions
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
