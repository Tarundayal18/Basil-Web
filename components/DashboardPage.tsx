"use client";

import { useMemo, useState, useEffect } from "react";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardStats } from "@/services/dashboard.service";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useCountry } from "@/contexts/CountryContext";
import { useI18n } from "@/contexts/I18nContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatCurrency } from "@/lib/region-config";
import ErrorDetectionAlert from "./ai/ErrorDetectionAlert";
import BusinessHealthScoreWidget from "./ai/BusinessHealthScore";
import NaturalLanguageSearch from "./ai/NaturalLanguageSearch";
import AutoReorderSuggestions from "./ai/AutoReorderSuggestions";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    cashCollected: 0,
    salesNetGST: 0,
    grossProfit: 0,
    monthlySales: 0,
    yearlySales: 0,
    netGSTPayable: 0,
    grossProfitMargin: 0,
    monthlyProfit: 0,
    yearlyProfit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();
  const { stores, selectedStore, selectStore } = useStore();
  const { country } = useCountry();
  const { t } = useI18n();
  const { trackButton, trackLink } = useAnalytics("Dashboard", false);
  const [scope, setScope] = useState<"ALL" | "STORE">("ALL");
  const [perStore, setPerStore] = useState<
    Array<{ storeId: string; storeName: string; stats: DashboardStats }>
  >([]);
  const [perStoreLoading, setPerStoreLoading] = useState(false);
  const [perStoreError, setPerStoreError] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [minMonthlySales, setMinMonthlySales] = useState("");
  const [maxMonthlySales, setMaxMonthlySales] = useState("");

  const canUseAllStores = useMemo(() => {
    if (stores.length <= 1) return false;
    // Prefer tenant role when present; otherwise default to allowing for shopkeeper owners.
    return user?.isAdmin === true || user?.tenantRole === "OWNER" || !user?.tenantRole;
  }, [stores.length, user?.isAdmin, user?.tenantRole]);

  useEffect(() => {
    fetchDashboardData();
  }, [scope, selectedStore?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      const data =
        scope === "STORE" && selectedStore?.id
          ? await dashboardService.getStats(selectedStore.id)
          : await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canUseAllStores || scope !== "ALL" || stores.length < 2) {
      setPerStore([]);
      return;
    }

    const fetchPerStore = async () => {
      try {
        setPerStoreLoading(true);
        setPerStoreError("");
        const results = await Promise.all(
          stores.map(async (s) => {
            const sStats = await dashboardService.getStats(s.id);
            return { storeId: s.id, storeName: s.name, stats: sStats };
          })
        );
        setPerStore(results);
      } catch (e) {
        setPerStoreError(
          e instanceof Error ? e.message : "Failed to load store comparison"
        );
      } finally {
        setPerStoreLoading(false);
      }
    };

    fetchPerStore();
  }, [canUseAllStores, scope, stores]);

  const filteredPerStore = useMemo(() => {
    const q = storeSearch.trim().toLowerCase();
    const min = minMonthlySales.trim() ? Number(minMonthlySales) : null;
    const max = maxMonthlySales.trim() ? Number(maxMonthlySales) : null;

    return perStore.filter((row) => {
      if (q && !row.storeName.toLowerCase().includes(q)) return false;
      const sales = row.stats.monthlySales || 0;
      if (min !== null && !Number.isNaN(min) && sales < min) return false;
      if (max !== null && !Number.isNaN(max) && sales > max) return false;
      return true;
    });
  }, [perStore, storeSearch, minMonthlySales, maxMonthlySales]);

  const topBottom = useMemo(() => {
    if (perStore.length === 0) return null;
    const sorted = perStore
      .slice()
      .sort((a, b) => (b.stats.monthlySales || 0) - (a.stats.monthlySales || 0));
    return { top: sorted[0], bottom: sorted[sorted.length - 1] };
  }, [perStore]);

  // Currency formatting is now handled by formatCurrency from region-config (country-aware)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="dashboard">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          {canUseAllStores && (
            <div className="mt-2 inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  trackButton("Dashboard Scope All Stores", { scope: "ALL" });
                  setScope("ALL");
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  scope === "ALL"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                All stores
              </button>
              <button
                type="button"
                onClick={() => {
                  trackButton("Dashboard Scope Selected Store", {
                    scope: "STORE",
                    store_id: selectedStore?.id,
                  });
                  setScope("STORE");
                }}
                disabled={!selectedStore}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  scope === "STORE"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                This store{selectedStore?.name ? `: ${selectedStore.name}` : ""}
              </button>
            </div>
          )}
        </div>
        {user && (
          <button
            onClick={() => {
              trackButton("Logout", { location: "dashboard_page" });
              logout();
            }}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Logout
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {/* AI Error Detection Alert */}
      <ErrorDetectionAlert />

      {/* AI Features Section */}
      <div className="mb-8 space-y-6">
        {/* Quick AI Features Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/ai?tab=reorder"
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">📦</div>
              <div>
                <div className="font-semibold text-gray-900">Auto Reorder</div>
                <div className="text-xs text-gray-600">Smart inventory suggestions</div>
              </div>
            </div>
          </Link>
          <Link
            href="/ai?tab=pricing"
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="font-semibold text-gray-900">Pricing Assistant</div>
                <div className="text-xs text-gray-600">Optimize your pricing</div>
              </div>
            </div>
          </Link>
          <Link
            href="/ai"
            className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <div className="font-semibold text-gray-900">All AI Features</div>
                <div className="text-xs text-gray-600">Explore all capabilities</div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Cash Collected (Incl GST) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Cash Collected (Incl GST)
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.cashCollected)}
          </p>
          <p className="text-xs text-gray-500">Matches payments received</p>
        </div>

        {/* Sales (Net of GST) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Sales (Net of GST)
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.salesNetGST, country)}
          </p>
          <p className="text-xs text-gray-500">Actual revenue (excl GST)</p>
        </div>

        {/* Net Profit (Net of GST) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Net Profit (Net of GST)
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.grossProfit)}
          </p>
          <p className="text-xs text-gray-500">
            Margin {stats.grossProfitMargin.toFixed(2)}%
          </p>
        </div>

        {/* Monthly Sales (Incl GST) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Monthly Sales (Incl GST)
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.monthlySales, country)}
          </p>
          <p className="text-xs text-gray-500">
            {t('dashboard.profit') || "Profit"} {formatCurrency(stats.monthlyProfit || 0, country)}
          </p>
        </div>

        {/* Yearly Sales (Incl GST) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Yearly Sales (Incl GST)
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.yearlySales, country)}
          </p>
          <p className="text-xs text-gray-500">
            Profit {formatCurrency(stats.yearlyProfit)}
          </p>
        </div>

        {/* Net GST Payable (Today) */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Net GST Payable (Today)
          </h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(stats.netGSTPayable)}
          </p>
          <p className="text-xs text-gray-500">Payable to Govt</p>
        </div>
      </div>

      {/* All Stores Comparison (Owner-only, All Stores scope) */}
      {canUseAllStores && scope === "ALL" && stores.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Store Performance
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Compare stores. Click a row to drill down.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                trackButton("Refresh Store Comparison", {
                  location: "dashboard",
                });
                // re-trigger effect by toggling scope twice
                setScope("STORE");
                setTimeout(() => setScope("ALL"), 0);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>

          {perStoreError && (
            <div className="m-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800">
              {perStoreError}
            </div>
          )}

          {topBottom && !perStoreLoading && (
            <div className="px-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-xs font-medium text-green-700 uppercase tracking-wide">
                  Top store (this month)
                </div>
                <div className="mt-1 text-lg font-semibold text-green-900">
                  {topBottom.top.storeName}
                </div>
                <div className="mt-1 text-sm text-green-800">
                  Sales: {formatCurrency(topBottom.top.stats.monthlySales || 0, country)} · Profit:{" "}
                  {formatCurrency(topBottom.top.stats.monthlyProfit || 0, country)}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                  Bottom store (this month)
                </div>
                <div className="mt-1 text-lg font-semibold text-amber-900">
                  {topBottom.bottom.storeName}
                </div>
                <div className="mt-1 text-sm text-amber-800">
                  Sales: {formatCurrency(topBottom.bottom.stats.monthlySales || 0, country)} · Profit:{" "}
                  {formatCurrency(topBottom.bottom.stats.monthlyProfit || 0, country)}
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Search store
              </label>
              <input
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Type store name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-56">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Min monthly sales
              </label>
              <input
                value={minMonthlySales}
                onChange={(e) => setMinMonthlySales(e.target.value)}
                placeholder="e.g. 10000"
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-56">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max monthly sales
              </label>
              <input
                value={maxMonthlySales}
                onChange={(e) => setMaxMonthlySales(e.target.value)}
                placeholder="e.g. 50000"
                inputMode="numeric"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Sales (Incl)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Profit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Collected (Today)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margin %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {perStoreLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      Loading store comparison...
                    </td>
                  </tr>
                ) : perStore.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-gray-500"
                    >
                      No store data available.
                    </td>
                  </tr>
                ) : (
                  filteredPerStore
                    .slice()
                    .sort((a, b) => (b.stats.monthlySales || 0) - (a.stats.monthlySales || 0))
                    .map((row) => (
                      <tr
                        key={row.storeId}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          trackButton("Dashboard Drilldown Store", {
                            store_id: row.storeId,
                            store_name: row.storeName,
                          });
                          selectStore(row.storeId);
                          setScope("STORE");
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.storeName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(row.stats.monthlySales || 0, country)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(row.stats.monthlyProfit || 0, country)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(row.stats.cashCollected || 0, country)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {(row.stats.grossProfitMargin || 0).toFixed(2)}%
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <BusinessHealthScoreWidget period="MONTH" />
        <NaturalLanguageSearch compact={false} />
      </div>

      {/* Auto-Reorder Suggestions */}
      <div className="mb-8">
        <AutoReorderSuggestions maxSuggestions={5} />
      </div>

      <div className="mt-6">
        <Link
          href="/reports"
          onClick={() => trackLink("Go to Reports", "/reports", { location: "dashboard_page" })}
          className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center"
        >
          Go to Reports →
        </Link>
      </div>
    </div>
  );
}
