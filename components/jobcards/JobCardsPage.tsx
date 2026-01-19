"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Calendar, Filter } from "lucide-react";
import {
  jobCardsService,
  JobCard,
  JobCardStatus,
  JobCardPriority,
} from "@/services/jobCards.service";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDebounce } from "@/hooks/useDebounce";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";

export default function JobCardsPage() {
  const router = useRouter();
  const { trackButton } = useAnalytics("Job Cards Page", false);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageHistory, setPageHistory] = useState<
    Array<{ lastKey: string | null; hasMore: boolean }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<JobCardStatus | "ALL">(
    "ALL"
  );
  const [selectedPriority, setSelectedPriority] = useState<
    JobCardPriority | "ALL"
  >("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    setJobCards([]);
    setHasMore(false);
    setError("");
    setCurrentPage(1);
    setPageHistory([]);
    fetchJobCards(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedStatus, selectedPriority, startDate, endDate]);

  const fetchJobCards = async (page: number, pageLastKey?: string | null) => {
    try {
      setLoading(true);
      const params: {
        limit: number;
        lastKey?: string;
        status?: JobCardStatus;
        fromDate?: string;
        toDate?: string;
      } = {
        limit: 20,
      };

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

      if (selectedStatus !== "ALL") {
        params.status = selectedStatus;
      }
      if (startDate) {
        params.fromDate = startDate;
      }
      if (endDate) {
        params.toDate = endDate;
      }

      const response = await jobCardsService.listJobCards(params);
      const newJobCards = response.items || [];
      const pagination = response.pagination;
      const newLastKey = pagination?.lastKey || null;
      const newHasMore = pagination?.hasMore || false;

      if (page === 1) {
        setJobCards(newJobCards);
      } else {
        setJobCards((prev) => [...prev, ...newJobCards]);
      }

      setPageHistory((prev) => {
        const newHistory = [...prev];
        newHistory[page - 1] = {
          lastKey: newLastKey,
          hasMore: newHasMore,
        };
        return newHistory;
      });

      setHasMore(newHasMore);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load job cards"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      fetchJobCards(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchJobCards(nextPage);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    // Convert to number if it's a string or handle null/undefined
    const numAmount = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
    if (isNaN(numAmount)) return "₹0.00";
    return `₹${numAmount.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter job cards by search query and priority (client-side for better UX)
  const filteredJobCards = jobCards.filter((jobCard) => {
    const matchesSearch =
      !debouncedSearch ||
      jobCard.jobCardNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      jobCard.customer.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (jobCard.customer.phone && jobCard.customer.phone.includes(debouncedSearch)) ||
      (jobCard.title && jobCard.title.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const matchesPriority =
      selectedPriority === "ALL" || jobCard.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  const statusOptions: (JobCardStatus | "ALL")[] = [
    "ALL",
    "CREATED",
    "INSPECTION",
    "ESTIMATE_SENT",
    "APPROVED",
    "IN_PROGRESS",
    "WAITING_FOR_PARTS",
    "QC_CHECK",
    "READY_FOR_DELIVERY",
    "CLOSED",
    "CANCELLED",
  ];

  const priorityOptions: (JobCardPriority | "ALL")[] = [
    "ALL",
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
  ];

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Cards</h1>
          <p className="text-gray-600 mt-1">
            Manage service requests and work orders
          </p>
        </div>
        <button
          onClick={() => {
            trackButton("New Job Card", { location: "job_cards_page" });
            router.push("/jobcards/new");
          }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Job Card
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by job card number, customer name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as JobCardStatus | "ALL")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Status" : status.replace("_", " ")}
              </option>
            ))}
          </select>
          <select
            value={selectedPriority}
            onChange={(e) =>
              setSelectedPriority(e.target.value as JobCardPriority | "ALL")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority === "ALL" ? "All Priority" : priority}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="From Date"
              className="border-none outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="To Date"
              className="border-none outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {loading && jobCards.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading job cards...</p>
        </div>
      ) : filteredJobCards.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-gray-600">No job cards found</p>
          <button
            onClick={() => router.push("/jobcards/new")}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Create Your First Job Card
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Card
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobCards.map((jobCard) => (
                    <tr
                      key={jobCard.jobCardId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/jobcards/${jobCard.jobCardId}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {jobCard.jobCardNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {jobCard.title || "No title"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {jobCard.customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {jobCard.customer.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={jobCard.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PriorityBadge priority={jobCard.priority} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(jobCard.totalCost || 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(jobCard.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
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
    </div>
  );
}

