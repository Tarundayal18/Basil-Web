"use client";

import { useState, useEffect } from "react";
import { aiService, ReorderSuggestion } from "@/services/ai.service";
import { Package, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface AutoReorderSuggestionsProps {
  maxSuggestions?: number;
  onReorder?: (suggestion: ReorderSuggestion) => void;
}

export default function AutoReorderSuggestions({
  maxSuggestions = 10,
  onReorder,
}: AutoReorderSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await aiService.getReorderSuggestions({
        includeLowStock: true,
        maxSuggestions,
      });
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return <AlertTriangle className="w-4 h-4" />;
      case "HIGH":
        return <Clock className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">All stocked up!</p>
        <p className="text-sm text-gray-500 mt-1">No reorder suggestions at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Reorder Suggestions</h3>
        <button
          onClick={fetchSuggestions}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.productId}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">{suggestion.productName}</h4>
                <p className="text-sm text-gray-600">{suggestion.reason}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${getUrgencyColor(
                  suggestion.urgency
                )}`}
              >
                {getUrgencyIcon(suggestion.urgency)}
                {suggestion.urgency}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Current Stock</p>
                <p className="font-semibold text-gray-900">{suggestion.currentStock}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Suggested Qty</p>
                <p className="font-semibold text-indigo-600">{suggestion.suggestedQuantity}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Confidence</p>
                <p className="font-semibold text-gray-900">
                  {(suggestion.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {suggestion.estimatedDaysUntilOutOfStock && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Estimated to run out in {suggestion.estimatedDaysUntilOutOfStock} day
                  {suggestion.estimatedDaysUntilOutOfStock !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {onReorder && (
              <button
                onClick={() => onReorder(suggestion)}
                className="mt-3 w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                Add to Purchase Order
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

