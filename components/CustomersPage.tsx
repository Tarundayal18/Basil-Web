"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, Phone, Mail, Plus, Upload, Download, Search, RefreshCw, X, ArrowUpDown } from "lucide-react";
import {
  customersService,
  CustomerSummary,
} from "@/services/customers.service";
import type { Customer } from "@/services/customers.service";
import { useAnalytics } from "@/hooks/useAnalytics";
import AddCustomerModal from "./AddCustomerModal";
import CustomerDetailsModal from "./CustomerDetailsModal";
import ImportCustomersModal, {
  type ImportResult,
} from "./customers/ImportCustomersModal";
import { useDebounce } from "@/hooks/useDebounce";
import { useStore } from "@/contexts/StoreContext";
import { crmEnhancedService, CustomerSegment } from "@/services/crm-enhanced.service";
import Link from "next/link";

/**
 * CustomersPage component displays a list of customers with pagination and search.
 * Uses page-based pagination similar to OrdersPage for consistency and scalability.
 */
export default function CustomersPage() {
  const { selectedStore } = useStore();
  const { trackButton, track, events } = useAnalytics("Customers Page", false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<
    Array<{ lastKey: string | null; hasMore: boolean }>
  >([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>("all");
  const [selectedCrmSegmentId, setSelectedCrmSegmentId] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [crmSegments, setCrmSegments] = useState<CustomerSegment[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "ltv" | "orders">("recent");
  const [refreshingSegments, setRefreshingSegments] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (!selectedStore?.id) return;
    const key = `basil.customers.recentSearches.${selectedStore.id}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentSearches(parsed.filter((s) => typeof s === "string"));
      }
    } catch {
      // ignore
    }
  }, [selectedStore?.id]);

  useEffect(() => {
    if (!selectedStore?.id) return;
    // Keep segments best-effort; if CRM isn't deployed, just hide the filter
    crmEnhancedService
      .listSegments()
      .then((data) => setCrmSegments(data || []))
      .catch(() => setCrmSegments([]));
  }, [selectedStore?.id]);

  useEffect(() => {
    if (!selectedStore?.id) return;
    const q = debouncedSearch?.trim();
    if (!q) return;
    const key = `basil.customers.recentSearches.${selectedStore.id}`;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, 8);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [debouncedSearch, selectedStore?.id]);

  useEffect(() => {
    // Reset and fetch when search or filter changes
    setCustomers([]);
    setHasMore(false);
    setError(""); // Clear any previous errors
    setCurrentPage(1);
    setPageHistory([]);
    fetchCustomers(1);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCustomerType, selectedCrmSegmentId, selectedTags.join(",")]);

  /**
   * Fetches customers for a specific page.
   * @param page - Page number (1-indexed)
   * @param pageLastKey - Optional lastKey for the page (for navigation)
   */
  const fetchCustomers = async (page: number, pageLastKey?: string | null) => {
    try {
      setLoading(true);
      const params: {
        limit: number;
        lastKey?: string;
        customerType?: string;
        segmentId?: string;
        tags?: string;
        search?: string;
        storeId: string;
      } = {
        limit: 10,
        storeId: selectedStore!.id,
      };

      // Use provided pageLastKey or get from history
      const lastKeyToUse =
        pageLastKey !== undefined
          ? pageLastKey
          : page > 1 && pageHistory[page - 2]
          ? pageHistory[page - 2].lastKey
          : null;

      if (
        lastKeyToUse &&
        lastKeyToUse !== "undefined" &&
        lastKeyToUse !== "null"
      ) {
        params.lastKey = lastKeyToUse;
      }

      if (selectedCustomerType !== "all") {
        params.customerType = selectedCustomerType;
      }
      if (selectedCrmSegmentId !== "all") {
        params.segmentId = selectedCrmSegmentId;
      }
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(",");
      }
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await customersService.getCustomers(params);
      const newCustomers = response.data || [];
      const pagination = response.pagination;
      const newLastKey = pagination?.lastKey || null;
      const newHasMore = pagination?.hasMore || false;

      setCustomers(newCustomers);
      setHasMore(newHasMore);
      setCurrentPage(page);

      // Update page history
      setPageHistory((prev) => {
        const updated = [...prev];
        // Ensure array is large enough
        while (updated.length < page) {
          updated.push({ lastKey: null, hasMore: false });
        }
        updated[page - 1] = { lastKey: newLastKey, hasMore: newHasMore };
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigates to the next page.
   */
  const handleNextPage = () => {
    if (hasMore && !loading) {
      const nextPage = currentPage + 1;
      fetchCustomers(nextPage);
    }
  };

  /**
   * Navigates to the previous page.
   */
  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      const prevPage = currentPage - 1;
      // fetchCustomers will automatically get the correct lastKey from pageHistory
      fetchCustomers(prevPage);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await customersService.getSummary(selectedStore!.id);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary:", err);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(1)}`;
  };

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    setSelectedTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  };
  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  const getSegmentColor = (segment?: string) => {
    const normalized = (segment || "retail").toLowerCase();
    const seg = normalized === "regular" ? "retail" : normalized;
    switch (seg) {
      case "vip":
        return "bg-purple-100 text-purple-800";
      case "wholesale":
        return "bg-blue-100 text-blue-800";
      case "corporate":
        return "bg-amber-100 text-amber-800";
      case "retail":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatSegmentLabel = (segment?: string) => {
    const normalized = (segment || "retail").toLowerCase();
    const seg = normalized === "regular" ? "retail" : normalized;
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCustomerType("all");
    setSelectedCrmSegmentId("all");
    setSelectedTags([]);
    setTagInput("");
    setSortBy("recent");
  };

  const displayedCustomers = useMemo(() => {
    const list = customers.slice();
    switch (sortBy) {
      case "name":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "ltv":
        return list.sort((a, b) => Number(b.lifetimeValue || 0) - Number(a.lifetimeValue || 0));
      case "orders":
        return list.sort((a, b) => Number(b.ordersCount || 0) - Number(a.ordersCount || 0));
      case "recent":
      default:
        return list; // backend already returns newest-first
    }
  }, [customers, sortBy]);

  /**
   * Handles customer added event by refreshing the customer list.
   */
  const handleCustomerAdded = () => {
    setCustomers([]);
    setHasMore(false);
    setCurrentPage(1);
    setPageHistory([]);
    fetchCustomers(1);
    fetchSummary();
  };

  const handleExport = async () => {
    try {
      setError("");
      await customersService.exportCustomers("csv", selectedStore!.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to export customers"
      );
    }
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  /**
   * Handle customer import confirmation
   * @param file - The file to import
   * @returns Import result with statistics
   */
  const handleImportConfirm = async (file: File): Promise<ImportResult> => {
    try {
      setError("");
      setLoading(true);
      const result = await customersService.importCustomers(
        file,
        selectedStore!.id
      );
      // Refresh customer list and summary after successful import
      setCustomers([]);
      setHasMore(false);
      setCurrentPage(1);
      setPageHistory([]);
      fetchCustomers(1);
      fetchSummary();
      return result;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import customers"
      );
      throw err; // Re-throw so modal can handle it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">
            Enterprise CRM fully wired to backend
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              trackButton("Import Customers", { location: "customers_page" });
              track(events.CUSTOMER_IMPORTED, { action: "modal_opened" });
              handleImport();
            }}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={() => {
              trackButton("Export Customers", { location: "customers_page" });
              handleExport();
            }}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              trackButton("Add Customer", { location: "customers_page" });
              track(events.CUSTOMER_ADDED, { action: "modal_opened" });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {/* Summary Statistics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalCustomers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">VIP</p>
            <p className="text-2xl font-bold text-gray-900">{summary.vip}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Wholesale</p>
            <p className="text-2xl font-bold text-gray-900">{summary.wholesale}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Corporate</p>
            <p className="text-2xl font-bold text-gray-900">{summary.corporate}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-600 mb-1">Lifetime Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{summary.lifetimeRevenue.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          {isSearchFocused && recentSearches.length > 0 && (
            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 flex items-center justify-between">
                <span>Recent searches</span>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!selectedStore?.id) return;
                    const key = `basil.customers.recentSearches.${selectedStore.id}`;
                    try {
                      localStorage.removeItem(key);
                    } catch {
                      // ignore
                    }
                    setRecentSearches([]);
                  }}
                >
                  Clear
                </button>
              </div>
              {recentSearches.slice(0, 8).map((q) => (
                <button
                  key={q}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSearchQuery(q)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-gray-700"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCustomerType("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCustomerType === "all"
                ? "bg-black text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => setSelectedCustomerType("vip")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCustomerType === "vip"
                ? "bg-black text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            VIP
          </button>
          <button
            onClick={() => setSelectedCustomerType("retail")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCustomerType === "retail"
                ? "bg-black text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            RETAIL
          </button>
          <button
            onClick={() => setSelectedCustomerType("wholesale")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCustomerType === "wholesale"
                ? "bg-black text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            WHOLESALE
          </button>
          <button
            onClick={() => setSelectedCustomerType("corporate")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCustomerType === "corporate"
                ? "bg-black text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            CORPORATE
          </button>
        </div>
      </div>

      {/* CRM Segment + Tags + Sort */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              CRM Segment (dynamic)
            </label>
            <div className="flex items-center gap-2">
              <Link href="/crm/segments" className="text-xs text-blue-600 hover:text-blue-800">
                Manage
              </Link>
              <button
                type="button"
                className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                onClick={async () => {
                  try {
                    setRefreshingSegments(true);
                    await crmEnhancedService.autoRefreshAllSegments();
                    const data = await crmEnhancedService.listSegments();
                    setCrmSegments(data || []);
                    fetchCustomers(1);
                  } catch {
                    // ignore (CRM may not be deployed)
                  } finally {
                    setRefreshingSegments(false);
                  }
                }}
              >
                <RefreshCw className={`h-3 w-3 ${refreshingSegments ? "animate-spin" : ""}`} />
                Refresh all
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCrmSegmentId}
              onChange={(e) => setSelectedCrmSegmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All segments</option>
              {crmSegments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isDynamic ? "(Dynamic)" : "(Static)"} • {s.customerCount || 0}
                </option>
              ))}
            </select>
            {selectedCrmSegmentId !== "all" && (
              <button
                type="button"
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
                onClick={async () => {
                  try {
                    setRefreshingSegments(true);
                    await crmEnhancedService.refreshSegment(selectedCrmSegmentId);
                    const data = await crmEnhancedService.listSegments();
                    setCrmSegments(data || []);
                    fetchCustomers(1);
                  } catch {
                    // ignore
                  } finally {
                    setRefreshingSegments(false);
                  }
                }}
                disabled={refreshingSegments}
                title="Refresh selected segment"
              >
                <RefreshCw className={`h-4 w-4 ${refreshingSegments ? "animate-spin" : ""}`} />
              </button>
            )}
          </div>
          {crmSegments.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">No segments available (CRM may not be deployed).</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tags (multi-select)
          </label>
          <div className="flex flex-wrap gap-2 items-center border border-gray-300 rounded-lg px-2 py-2 bg-white">
            {selectedTags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-800"
              >
                {t}
                <button
                  type="button"
                  className="text-indigo-700 hover:text-indigo-900"
                  onClick={() => removeTag(t)}
                  aria-label={`Remove tag ${t}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                }
                if (e.key === "Backspace" && tagInput === "" && selectedTags.length > 0) {
                  removeTag(selectedTags[selectedTags.length - 1]);
                }
              }}
              placeholder={selectedTags.length === 0 ? "Type a tag and press Enter" : ""}
              className="flex-1 min-w-[160px] outline-none text-sm px-1"
            />
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-xs text-gray-500 hover:text-gray-700 px-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sort</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="recent">Most recent</option>
                <option value="name">Name (A→Z)</option>
                <option value="ltv">Lifetime value (high→low)</option>
                <option value="orders">Orders (high→low)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
              title="Clear all filters"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {(searchQuery.trim() ||
        selectedCustomerType !== "all" ||
        selectedCrmSegmentId !== "all" ||
        selectedTags.length > 0) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {searchQuery.trim() && (
            <span className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-800 inline-flex items-center gap-2">
              Search: {searchQuery.trim()}
              <button type="button" onClick={() => setSearchQuery("")} className="text-gray-600 hover:text-gray-900">
                ×
              </button>
            </span>
          )}
          {selectedCustomerType !== "all" && (
            <span className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-800 inline-flex items-center gap-2">
              Type: {selectedCustomerType}
              <button type="button" onClick={() => setSelectedCustomerType("all")} className="text-gray-600 hover:text-gray-900">
                ×
              </button>
            </span>
          )}
          {selectedCrmSegmentId !== "all" && (
            <span className="px-3 py-1.5 rounded-full text-xs bg-blue-50 text-blue-800 inline-flex items-center gap-2">
              Segment: {crmSegments.find((s) => s.id === selectedCrmSegmentId)?.name || selectedCrmSegmentId}
              <button type="button" onClick={() => setSelectedCrmSegmentId("all")} className="text-blue-700 hover:text-blue-900">
                ×
              </button>
            </span>
          )}
          {selectedTags.map((t) => (
            <span key={t} className="px-3 py-1.5 rounded-full text-xs bg-indigo-50 text-indigo-800 inline-flex items-center gap-2">
              Tag: {t}
              <button type="button" onClick={() => removeTag(t)} className="text-indigo-700 hover:text-indigo-900">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifetime Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {customer.id.slice(-10)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-500 space-x-2 mt-1">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {customer.ordersCount || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.lifetimeValue || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(
                            customer.segment
                          )}`}
                        >
                          {formatSegmentLabel(customer.customerType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            trackButton("View Customer", {
                              location: "customers_table",
                              customer_id: customer.id,
                            });
                            setSelectedCustomerId(customer.id);
                          }}
                          className="text-gray-600 hover:text-indigo-600 transition-colors"
                          aria-label="View customer"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            {/* Previous/Next Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">Page {currentPage}</span>
              <button
                onClick={handleNextPage}
                disabled={!hasMore || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleCustomerAdded}
        />
      )}

      {selectedCustomerId && (
        <CustomerDetailsModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}

      {showImportModal && (
        <ImportCustomersModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportConfirm}
        />
      )}
    </div>
  );
}
