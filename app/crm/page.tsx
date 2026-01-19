"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import { detectCRMFeatures, CRMFeatureFlags } from "@/lib/crm-feature-flags";
import {
  TrendingUp,
  Award,
  Wallet,
  CreditCard,
  Megaphone,
  Users,
  BarChart3,
  Package,
  AlertTriangle,
  Clock,
  Tag,
  UserCircle,
} from "lucide-react";
import Link from "next/link";

function CRMPageContent() {
  const { selectedStore } = useStore();
  const { track } = useAnalytics("CRM Dashboard", true);
  const [featureFlags, setFeatureFlags] = useState<CRMFeatureFlags | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    try {
      const flags = await detectCRMFeatures();
      setFeatureFlags(flags);
    } catch (err) {
      console.error("Error loading feature flags:", err);
    } finally {
      setLoadingFlags(false);
    }
  };

  const crmFeatures: Array<{
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
    featureFlag?: string;
  }> = [
    {
      title: "Customer Profiles",
      description: "View and manage comprehensive customer profiles",
      icon: UserCircle,
      href: "/crm/customers",
      color: "bg-indigo-500",
    },
    {
      title: "Follow-ups",
      description: "Upcoming follow-ups and reminders (pipeline view)",
      icon: Clock,
      href: "/crm/follow-ups",
      color: "bg-slate-600",
    },
    {
      title: "Top Products",
      description: "View top 10 products sold by quantity and revenue",
      icon: TrendingUp,
      href: "/crm/top-products",
      color: "bg-blue-500",
      featureFlag: "topProducts",
    },
    {
      title: "Loyalty Programs",
      description: "Manage customer loyalty points, rewards, and redemptions",
      icon: Award,
      href: "/crm/loyalty",
      color: "bg-purple-500",
      featureFlag: "loyalty",
    },
    {
      title: "Wallet Management",
      description: "Track customer wallet balances and transactions",
      icon: Wallet,
      href: "/crm/wallet",
      color: "bg-green-500",
      featureFlag: "wallet",
    },
    {
      title: "Credit Ledger",
      description: "Manage customer credit limits and outstanding balances",
      icon: CreditCard,
      href: "/crm/credit",
      color: "bg-orange-500",
      featureFlag: "credit",
    },
    {
      title: "Campaigns",
      description: "Create and manage marketing campaigns",
      icon: Megaphone,
      href: "/crm/campaigns",
      color: "bg-pink-500",
      featureFlag: "campaigns",
    },
    {
      title: "Segments",
      description: "Create and manage dynamic customer segments",
      icon: Users,
      href: "/crm/segments",
      color: "bg-cyan-500",
      featureFlag: "segments",
    },
    {
      title: "Offers & Coupons",
      description: "Create and manage promotional offers",
      icon: Tag,
      href: "/crm/offers",
      color: "bg-yellow-500",
      featureFlag: "offers",
    },
    {
      title: "Top Customers",
      description: "View top customers by revenue",
      icon: BarChart3,
      href: "/crm/reports/top-customers",
      color: "bg-emerald-500",
      featureFlag: "reports.topCustomers",
    },
    {
      title: "Slow-Moving Products",
      description: "Identify products that haven't sold recently",
      icon: Package,
      href: "/crm/reports/slow-moving",
      color: "bg-red-500",
      featureFlag: "reports.slowMoving",
    },
    {
      title: "Churn Risk Analysis",
      description: "Identify customers at risk of churning",
      icon: AlertTriangle,
      href: "/crm/reports/churn",
      color: "bg-rose-500",
      featureFlag: "reports.churn",
    },
    {
      title: "Peak Sales Hours",
      description: "Analyze sales performance by hour",
      icon: Clock,
      href: "/crm/reports/peak-hours",
      color: "bg-violet-500",
      featureFlag: "reports.peakHours",
    },
    {
      title: "Staff Performance",
      description: "Track staff sales and service metrics",
      icon: Users,
      href: "/crm/staff",
      color: "bg-teal-500",
      featureFlag: "staff",
    },
  ];

  useEffect(() => {
    track("crm_dashboard_viewed", {
      storeId: selectedStore?.id,
    });
  }, [selectedStore, track]);

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to access CRM features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive Customer Relationship Management tools for your business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {crmFeatures
          .filter((feature) => {
            // Always show basic features (customer profiles, etc.)
            if (!feature.featureFlag) return true;
            // Filter based on feature flags
            if (!featureFlags) return true; // Show all while loading
            if (feature.featureFlag.includes(".")) {
              const [parent, child] = feature.featureFlag.split(".");
              const parentFlags = featureFlags[parent as keyof CRMFeatureFlags] as any;
              return parentFlags?.[child] === true;
            }
            return featureFlags[feature.featureFlag as keyof CRMFeatureFlags] === true;
          })
          .map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${feature.color} p-3 rounded-lg flex-shrink-0`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-blue-600">-</p>
            <p className="text-xs text-gray-500 mt-1">View in Customers page</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Active Loyalty Members</p>
            <p className="text-2xl font-bold text-purple-600">-</p>
            <p className="text-xs text-gray-500 mt-1">View in Loyalty page</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Wallet Balance</p>
            <p className="text-2xl font-bold text-green-600">-</p>
            <p className="text-xs text-gray-500 mt-1">View in Wallet page</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
  return (
    <ProtectedRoute>
      <CRMPageContent />
    </ProtectedRoute>
  );
}

