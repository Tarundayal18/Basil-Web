/**
 * Customer Interaction Timeline Page
 * Chronological view of all customer interactions
 */

"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, InteractionHistory } from "@/services/crm-enhanced.service";
import Toast from "@/components/Toast";

export default function CustomerTimelinePage() {
  return (
    <ProtectedRoute>
      <CustomerTimelineContent />
    </ProtectedRoute>
  );
}

function CustomerTimelineContent() {
  const params = useParams();
  const customerId = params.id as string;

  const [interactions, setInteractions] = useState<InteractionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [filter, setFilter] = useState<
    "ALL" | "PURCHASE" | "JOB_CARD" | "WHATSAPP" | "EMAIL" | "NOTES" | "FOLLOW_UP"
  >("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (customerId) {
      loadTimeline();
    }
  }, [customerId]);

  const loadTimeline = async (loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
        setInteractions([]);
      }
      setError("");

      const result = await crmEnhancedService.getCustomerTimeline(
        customerId,
        50,
        loadMore ? lastKey : undefined
      );

      if (loadMore) {
        setInteractions([...interactions, ...result.items]);
      } else {
        setInteractions(result.items);
      }

      setLastKey(result.lastKey);
      setHasMore(!!result.lastKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "🛒";
      case "JOB_CARD":
        return "🔧";
      case "WHATSAPP":
        return "💬";
      case "EMAIL":
        return "📧";
      case "LOYALTY_EARNED":
        return "⭐";
      case "LOYALTY_REDEEMED":
        return "🎁";
      case "WALLET_TRANSACTION":
        return "💰";
      case "CREDIT_GIVEN":
        return "📝";
      case "PAYMENT_RECEIVED":
        return "✅";
      default:
        return "📋";
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return "bg-green-100 text-green-800";
      case "JOB_CARD":
        return "bg-blue-100 text-blue-800";
      case "LOYALTY_EARNED":
        return "bg-yellow-100 text-yellow-800";
      case "WALLET_TRANSACTION":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Interaction Timeline</h1>
        <p className="text-gray-600 mt-1">Complete history of customer interactions</p>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["ALL", "PURCHASE", "JOB_CARD", "WHATSAPP", "EMAIL", "NOTES", "FOLLOW_UP"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                filter === f
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search timeline"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        />
      </div>

      {(() => {
        const filtered = interactions.filter((i) => {
          if (filter === "ALL") return true;
          const it = (i.interactionType || "").toUpperCase();
          if (filter === "NOTES") return it === "MANUAL_NOTE";
          if (filter === "FOLLOW_UP") return it === "FOLLOW_UP" || it === "FOLLOW_UP_DONE";
          return it === filter;
        }).filter((i) => {
          if (!search.trim()) return true;
          const q = search.trim().toLowerCase();
          const hay = `${i.title || ""} ${i.description || ""} ${i.channel || ""} ${i.interactionType || ""}`.toLowerCase();
          return hay.includes(q);
        });

        const groups = new Map<string, InteractionHistory[]>();
        for (const i of filtered) {
          const k = new Date(i.interactionDate).toISOString().slice(0, 10);
          const arr = groups.get(k) || [];
          arr.push(i);
          groups.set(k, arr);
        }
        const keys = Array.from(groups.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        if (loading && interactions.length === 0) return null;

        return (
          <div className="space-y-6">
            {keys.map((k) => (
              <div key={k}>
                <div className="text-xs font-medium text-gray-500 mb-2">
                  {new Date(k).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}
                </div>
                <div className="space-y-3">
                  {(groups.get(k) || []).map((interaction) => (
                    <div
                      key={interaction.id}
                      className="bg-white rounded-lg shadow p-4 md:p-6 flex gap-4"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getInteractionColor(
                            interaction.interactionType
                          )}`}
                        >
                          {getInteractionIcon(interaction.interactionType)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{interaction.title}</h3>
                            {interaction.description && (
                              <p className="text-gray-600 mt-1">{interaction.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(interaction.interactionDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(interaction.interactionDate).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{interaction.interactionType.toLowerCase().replace(/_/g, " ")}</span>
                          <span>•</span>
                          <span className="capitalize">{interaction.channel.toLowerCase()}</span>
                          {interaction.amount !== undefined && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-gray-900">
                                ₹{interaction.amount.toLocaleString("en-IN")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {loading && interactions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : interactions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No interactions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => loadTimeline(true)}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />
    </div>
  );
}

