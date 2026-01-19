/**
 * This file contains the OrdersPage component which displays and manages customer invoices/bills.
 * It includes pagination and search functionality for viewing existing invoices.
 */

"use client";

import { useState, useEffect } from "react";
import { ordersService, Order } from "@/services/orders.service";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import OrderModal from "./orders/OrderModal";
import OrderList from "./orders/OrderList";

/**
 * OrdersPage component displays a list of invoices/bills with pagination and search.
 * This component is used for viewing existing invoices only.
 */
export default function OrdersPage() {
  const { selectedStore } = useStore();
  const { trackButton } = useAnalytics("Invoices Page", false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<
    Array<{ lastKey: string | null; hasMore: boolean }>
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Reset and fetch when search or filters change
    setOrders([]);
    setHasMore(false);
    setError(""); // Clear any previous errors
    setCurrentPage(1);
    setPageHistory([]);
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, startDate, endDate]);

  /**
   * Fetches orders for a specific page.
   * @param page - Page number (1-indexed)
   * @param pageLastKey - Optional lastKey for the page (for navigation)
   */
  const fetchOrders = async (page: number, pageLastKey?: string | null) => {
    try {
      setLoading(true);
      if (!selectedStore?.id) {
        setError("No store selected");
        setLoading(false);
        return;
      }
      const params: {
        limit: number;
        lastKey?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        storeId?: string;
      } = {
        limit: 10,
        storeId: selectedStore.id,
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

      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }
      const response = await ordersService.getOrders(params);
      const newOrders = response.data || [];
      const pagination = response.pagination;
      const newLastKey = pagination?.lastKey || null;
      const newHasMore = pagination?.hasMore || false;

      setOrders(newOrders);
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
      setError(err instanceof Error ? err.message : "Failed to load orders");
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
      fetchOrders(nextPage);
    }
  };

  /**
   * Navigates to the previous page.
   */
  const handlePreviousPage = () => {
    if (currentPage > 1 && !loading) {
      const prevPage = currentPage - 1;
      // fetchOrders will automatically get the correct lastKey from pageHistory
      fetchOrders(prevPage);
    }
  };

  /**
   * Handles viewing order details by fetching the order and opening the modal.
   * @param id - The order ID to view
   */
  const handleViewOrder = async (id: string) => {
    try {
      const order = await ordersService.getOrderById(id);
      setSelectedOrder(order);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load order details"
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Invoices
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage customer invoices
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search bill (customer name, phone, order price, bill ID)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[40px]">
                From:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[40px]">
                To:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                }}
                min={startDate || undefined}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  trackButton("Clear Date Filter", {
                    location: "invoices_page",
                  });
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap sm:w-auto w-full"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      ) : (
        <>
          <OrderList orders={orders} onViewOrder={handleViewOrder} />

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

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
