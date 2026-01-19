"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { aiService } from "@/services/ai.service";
import type {
  BusinessHealthScore,
  ReorderSuggestion,
  PricingAnalysis,
  CustomerSegmentation,
  InvoiceError,
  ErrorSummary,
} from "@/services/ai.service";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import BusinessHealthScoreWidget from "@/components/ai/BusinessHealthScore";
import NaturalLanguageSearch from "@/components/ai/NaturalLanguageSearch";
import AutoReorderSuggestions from "@/components/ai/AutoReorderSuggestions";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

function AIFeaturesContent() {
  const { selectedStore } = useStore();
  const { track, trackButton } = useAnalytics("AI Features Page", true);
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState<
    "overview" | "health" | "errors" | "reorder" | "pricing" | "customers" | "search"
  >((tabParam as any) || "overview");

  // Update activeTab when URL tab parameter changes
  useEffect(() => {
    if (tabParam && ["overview", "health", "errors", "reorder", "pricing", "customers", "search"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    } else {
      setActiveTab("overview");
    }
  }, [tabParam]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Data states
  const [healthScore, setHealthScore] = useState<BusinessHealthScore | null>(null);
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis | null>(null);
  const [customerSegmentation, setCustomerSegmentation] = useState<CustomerSegmentation | null>(null);
  const [errors, setErrors] = useState<InvoiceError[]>([]);
  const [errorSummary, setErrorSummary] = useState<ErrorSummary | null>(null);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("all");
  const [errorSeverityFilter, setErrorSeverityFilter] = useState<string>("all");

  const fetchOverviewData = useCallback(async () => {
    if (!selectedStore) return;
    try {
      setLoading(true);
      setError("");

      // Fetch data based on active tab
      if (activeTab === "health") {
        const score = await aiService.getBusinessHealthScore("MONTH");
        setHealthScore(score);
      } else if (activeTab === "reorder") {
        const suggestions = await aiService.getReorderSuggestions({
          includeLowStock: true,
          maxSuggestions: 20,
        });
        setReorderSuggestions(suggestions);
      } else if (activeTab === "pricing") {
        const analysis = await aiService.analyzePricing({
          minMargin: 10,
          checkVendorPriceChanges: true,
        });
        setPricingAnalysis(analysis);
      } else if (activeTab === "customers") {
        const segmentation = await aiService.getCustomerSegmentation();
        setCustomerSegmentation(segmentation);
      } else if (activeTab === "errors") {
        setLoadingErrors(true);
        try {
          const today = new Date();
          const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
          const endDate = today.toISOString().split("T")[0];
          
          const [errorsResult, summaryResult] = await Promise.all([
            aiService.scanErrors({ startDate, endDate }),
            aiService.getErrorSummary({ startDate, endDate }),
          ]);
          
          setErrors(errorsResult.errors || []);
          setErrorSummary(summaryResult);
        } catch (err) {
          console.error("Failed to fetch errors:", err);
          setError(err instanceof Error ? err.message : "Failed to load errors");
          setErrors([]);
          setErrorSummary(null);
        } finally {
          setLoadingErrors(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch AI data:", err);
      setError(err instanceof Error ? err.message : "Failed to load AI features");
    } finally {
      if (activeTab !== "errors") {
        setLoading(false);
      }
    }
  }, [selectedStore, activeTab]);

  const fetchErrors = useCallback(async () => {
    if (!selectedStore) return;
    try {
      setLoadingErrors(true);
      setError("");
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const endDate = today.toISOString().split("T")[0];
      
      const [errorsResult, summaryResult] = await Promise.all([
        aiService.scanErrors({ startDate, endDate }),
        aiService.getErrorSummary({ startDate, endDate }),
      ]);
      
      setErrors(errorsResult.errors || []);
      setErrorSummary(summaryResult);
    } catch (err) {
      console.error("Failed to fetch errors:", err);
      setError(err instanceof Error ? err.message : "Failed to load errors");
      setErrors([]);
      setErrorSummary(null);
    } finally {
      setLoadingErrors(false);
    }
  }, [selectedStore]);

  useEffect(() => {
    if (selectedStore) {
      fetchOverviewData();
    }
  }, [selectedStore, fetchOverviewData]);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "health", label: "Business Health", icon: "💚" },
    { id: "errors", label: "Error Detection", icon: "⚠️" },
    { id: "reorder", label: "Auto Reorder", icon: "📦" },
    { id: "pricing", label: "Pricing Assistant", icon: "💰" },
    { id: "customers", label: "Customer Insights", icon: "👥" },
    { id: "search", label: "AI Search", icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Features</h1>
          <p className="text-gray-600">
            Enterprise-grade AI capabilities to optimize your business operations
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    trackButton(`AI Tab: ${tab.label}`, { tab: tab.id });
                  }}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Business Health Card */}
              <Link
                href="/ai?tab=health"
                onClick={(e) => {
                  e.preventDefault();
                  trackButton("View Business Health", { source: "overview" });
                  setActiveTab("health");
                  window.history.pushState({}, "", "/ai?tab=health");
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💚</div>
                  <span className="text-xs text-gray-500">Business Health</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Business Health Score
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Comprehensive health metrics including sales growth, stock turnover, tax compliance, and more.
                </p>
                <div className="text-sm text-indigo-600 font-medium">View Details →</div>
              </Link>

              {/* Error Detection Card */}
              <Link
                href="/ai?tab=errors"
                onClick={(e) => {
                  e.preventDefault();
                  trackButton("View Errors", { source: "overview" });
                  setActiveTab("errors");
                  window.history.pushState({}, "", "/ai?tab=errors");
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">⚠️</div>
                  <span className="text-xs text-gray-500">Error Detection</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Error Detection
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Automatically detects wrong HSN codes, GST mismatches, negative stock, duplicate invoices, and more.
                </p>
                <div className="text-sm text-indigo-600 font-medium">View Errors →</div>
              </Link>

              {/* Auto Reorder Card */}
              <Link
                href="/ai?tab=reorder"
                onClick={(e) => {
                  e.preventDefault();
                  trackButton("View Reorder Suggestions", { source: "overview" });
                  setActiveTab("reorder");
                  window.history.pushState({}, "", "/ai?tab=reorder");
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">📦</div>
                  <span className="text-xs text-gray-500">Inventory</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Smart Reorder Suggestions
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  AI-powered reorder recommendations based on sales patterns, seasonality, and lead times.
                </p>
                <div className="text-sm text-indigo-600 font-medium">View Suggestions →</div>
              </Link>

              {/* Pricing Assistant Card */}
              <Link
                href="/ai?tab=pricing"
                onClick={(e) => {
                  e.preventDefault();
                  trackButton("View Pricing Analysis", { source: "overview" });
                  setActiveTab("pricing");
                  window.history.pushState({}, "", "/ai?tab=pricing");
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💰</div>
                  <span className="text-xs text-gray-500">Pricing</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pricing Assistant
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Analyze margins, detect underpriced items, and get AI suggestions for optimal pricing.
                </p>
                <div className="text-sm text-indigo-600 font-medium">View Analysis →</div>
              </Link>

              {/* Customer Insights Card */}
              <Link
                href="/ai?tab=customers"
                onClick={(e) => {
                  e.preventDefault();
                  trackButton("View Customer Insights", { source: "overview" });
                  setActiveTab("customers");
                  window.history.pushState({}, "", "/ai?tab=customers");
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">👥</div>
                  <span className="text-xs text-gray-500">Customers</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Customer Intelligence
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Customer lifetime value, segmentation, payment behavior, and credit risk analysis.
                </p>
                <div className="text-sm text-indigo-600 font-medium">View Insights →</div>
              </Link>

              {/* AI Search Card */}
              <Link
                href="/ai?tab=search"
                onClick={(e) => {
                  e.preventDefault();
                  trackButton("View AI Search", { source: "overview" });
                  setActiveTab("search");
                  window.history.pushState({}, "", "/ai?tab=search");
                }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🔍</div>
                  <span className="text-xs text-gray-500">Search</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Natural Language Search
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Ask questions in plain English and get intelligent answers from your business data.
                </p>
                <div className="text-sm text-indigo-600 font-medium">Try Search →</div>
              </Link>
            </div>
          )}

          {activeTab === "health" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <BusinessHealthScoreWidget period="MONTH" compact={false} />
            </div>
          )}

          {activeTab === "errors" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Detected Errors
                  </h2>
                  <button
                    onClick={fetchErrors}
                    disabled={loadingErrors}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {loadingErrors ? "Loading..." : "🔄 Refresh"}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {loadingErrors ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading errors...</p>
                  </div>
                ) : errorSummary && errorSummary.totalErrors > 0 ? (
                  <div className="space-y-6">
                    {/* Error Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Error Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-600">Total Errors</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {errorSummary.totalErrors}
                          </div>
                        </div>
                        {Object.entries(errorSummary.errorsBySeverity).map(([severity, count]) => (
                          <div key={severity}>
                            <div className="text-xs text-gray-600">{severity}</div>
                            <div className={`text-2xl font-bold ${
                              severity === "CRITICAL" ? "text-red-600" :
                              severity === "HIGH" ? "text-orange-600" :
                              severity === "MEDIUM" ? "text-yellow-600" :
                              "text-blue-600"
                            }`}>
                              {count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Errors by Type */}
                    {Object.keys(errorSummary.errorsByType).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Errors by Type
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(errorSummary.errorsByType).map(([type, count]) => (
                            <span
                              key={type}
                              className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-medium"
                            >
                              {type.replace(/_/g, " ")}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Error List */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        All Errors ({errors.length})
                      </h3>
                      <div className="mb-4 flex gap-2">
                        <select
                          value={errorTypeFilter}
                          onChange={(e) => setErrorTypeFilter(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="all">All Types</option>
                          {Object.keys(errorSummary.errorsByType).map((type) => (
                            <option key={type} value={type}>
                              {type.replace(/_/g, " ")} ({errorSummary.errorsByType[type]})
                            </option>
                          ))}
                        </select>
                        <select
                          value={errorSeverityFilter}
                          onChange={(e) => setErrorSeverityFilter(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="all">All Severities</option>
                          {Object.keys(errorSummary.errorsBySeverity).map((severity) => (
                            <option key={severity} value={severity}>
                              {severity} ({errorSummary.errorsBySeverity[severity]})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const filteredErrors = errors.filter((err) => {
                            const typeMatch = errorTypeFilter === "all" || err.type === errorTypeFilter;
                            const severityMatch = errorSeverityFilter === "all" || err.severity === errorSeverityFilter;
                            return typeMatch && severityMatch;
                          });
                          return filteredErrors.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              No errors found matching filters
                            </div>
                          ) : (
                            filteredErrors.map((err, idx) => (
                            <div
                              key={idx}
                              className={`border-l-4 rounded-lg p-4 ${
                                err.severity === "CRITICAL"
                                  ? "border-red-500 bg-red-50"
                                  : err.severity === "HIGH"
                                  ? "border-orange-500 bg-orange-50"
                                  : err.severity === "MEDIUM"
                                  ? "border-yellow-500 bg-yellow-50"
                                  : "border-blue-500 bg-blue-50"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                      err.severity === "CRITICAL"
                                        ? "bg-red-600 text-white"
                                        : err.severity === "HIGH"
                                        ? "bg-orange-600 text-white"
                                        : err.severity === "MEDIUM"
                                        ? "bg-yellow-600 text-white"
                                        : "bg-blue-600 text-white"
                                    }`}>
                                      {err.severity}
                                    </span>
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                                      {err.type.replace(/_/g, " ")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-900 font-medium mb-1">
                                    {err.title || err.message || "Error detected"}
                                  </p>
                                  {err.description && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {err.description}
                                    </p>
                                  )}
                                  {err.suggestedFix && (
                                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                      <span className="font-medium text-blue-900">Suggested Fix:</span>{" "}
                                      <span className="text-blue-700">{err.suggestedFix}</span>
                                    </div>
                                  )}
                                  {err.details && (
                                    <div className="text-xs text-gray-600 mt-2">
                                      {Object.entries(err.details).map(([key, value]) => (
                                        <div key={key}>
                                          <span className="font-medium">{key}:</span> {String(value)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {(err.orderId || err.affectedEntity?.id) && (
                                    <Link
                                      href={`/invoices?orderId=${err.orderId || err.affectedEntity?.id}`}
                                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-2 inline-block"
                                    >
                                      View Invoice →
                                    </Link>
                                  )}
                                  {err.productId && (
                                    <Link
                                      href={`/products?productId=${err.productId}`}
                                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-2 ml-4 inline-block"
                                    >
                                      View Product →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Errors Detected
                    </h3>
                    <p className="text-sm text-gray-600">
                      Your invoices and inventory look good! No issues found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "reorder" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <AutoReorderSuggestions />
            </div>
          )}

          {activeTab === "pricing" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-600">Loading pricing analysis...</p>
                </div>
              ) : pricingAnalysis ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Analysis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-1">Total Products</div>
                        <div className="text-2xl font-bold text-gray-900">{pricingAnalysis.totalProducts}</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <div className="text-xs text-red-600 mb-1">Low Margin</div>
                        <div className="text-2xl font-bold text-red-600">{pricingAnalysis.productsWithLowMargin}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-xs text-green-600 mb-1">High Margin</div>
                        <div className="text-2xl font-bold text-green-600">{pricingAnalysis.productsWithHighMargin}</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-xs text-blue-600 mb-1">Avg Margin</div>
                        <div className="text-2xl font-bold text-blue-600">{(pricingAnalysis.averageMargin ?? 0).toFixed(1)}%</div>
                      </div>
                    </div>

                    {pricingAnalysis.underpricedItems && pricingAnalysis.underpricedItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Underpriced Items</h3>
                        <div className="space-y-2">
                          {pricingAnalysis.underpricedItems.slice(0, 10).map((item, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{item.productName}</div>
                                  <div className="text-sm text-gray-600">
                                    Current: ₹{(item.currentPrice ?? 0).toFixed(2)} → Suggested: ₹{(item.suggestedPrice ?? 0).toFixed(2)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-green-600">
                                    +{(item.marginIncrease ?? 0).toFixed(1)}% margin
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pricingAnalysis.vendorPriceChanges && pricingAnalysis.vendorPriceChanges.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Vendor Price Changes</h3>
                        <div className="space-y-2">
                          {pricingAnalysis.vendorPriceChanges.slice(0, 10).map((change, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">{change.productName}</div>
                                  <div className="text-sm text-gray-600">{change.vendorName}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-600">
                                    ₹{(change.oldPrice ?? 0).toFixed(2)} → ₹{(change.newPrice ?? 0).toFixed(2)}
                                  </div>
                                  <div className={`text-sm font-semibold ${
                                    (change.changePercent ?? 0) > 0 ? "text-red-600" : "text-green-600"
                                  }`}>
                                    {(change.changePercent ?? 0) > 0 ? "+" : ""}{(change.changePercent ?? 0).toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No pricing data available
                </div>
              )}
            </div>
          )}

          {activeTab === "customers" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                  <p className="text-gray-600">Loading customer insights...</p>
                </div>
              ) : customerSegmentation ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Segmentation</h2>
                    <div className="mb-4 text-sm text-gray-600">
                      Total Customers: {customerSegmentation.totalCustomers}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(customerSegmentation.segments || []).map((segment, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <div className="font-semibold text-gray-900 mb-2">{segment.name}</div>
                          <div className="text-2xl font-bold text-indigo-600 mb-1">{segment.count}</div>
                          <div className="text-sm text-gray-600 mb-2">
                            Avg CLV: ₹{(segment.averageClv ?? 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(segment.characteristics || []).join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No customer data available
                </div>
              )}
            </div>
          )}

          {activeTab === "search" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <NaturalLanguageSearch />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIFeaturesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading AI features...</p>
          </div>
        </div>
      }>
        <AIFeaturesContent />
      </Suspense>
    </ProtectedRoute>
  );
}
