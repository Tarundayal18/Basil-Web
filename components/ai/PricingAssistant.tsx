"use client";

import { useState } from "react";
import { aiService, PriceSuggestion } from "@/services/ai.service";
import { TrendingUp, TrendingDown, IndianRupee, Sparkles } from "lucide-react";

interface PricingAssistantProps {
  productId: string;
  productName: string;
  currentPrice: number;
  onPriceUpdate?: (newPrice: number) => void;
}

export default function PricingAssistant({
  productId,
  productName,
  currentPrice,
  onPriceUpdate,
}: PricingAssistantProps) {
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [marketTrend, setMarketTrend] = useState<"UP" | "DOWN" | "STABLE">("STABLE");
  const [demandLevel, setDemandLevel] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");

  const handleGetSuggestion = async () => {
    try {
      setLoading(true);
      setError("");
      setSuggestion(null);

      const result = await aiService.suggestPrice({
        productId,
        marketTrend,
        demandLevel,
      });
      setSuggestion(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get price suggestion");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (suggestion && onPriceUpdate) {
      onPriceUpdate(suggestion.suggestedPrice);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Pricing Assistant</h3>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Product: {productName}</p>
        <p className="text-sm text-gray-600">Current Price: ₹{currentPrice.toFixed(2)}</p>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Market Trend</label>
          <select
            value={marketTrend}
            onChange={(e) => setMarketTrend(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="UP">Trending Up</option>
            <option value="STABLE">Stable</option>
            <option value="DOWN">Trending Down</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Demand Level</label>
          <select
            value={demandLevel}
            onChange={(e) => setDemandLevel(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleGetSuggestion}
        disabled={loading}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium mb-4"
      >
        {loading ? "Analyzing..." : "Get Price Suggestion"}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {suggestion && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Suggested Price</span>
            <span className="text-2xl font-bold text-indigo-600">
              ₹{suggestion.suggestedPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {suggestion.changePercent > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : suggestion.changePercent < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <IndianRupee className="w-4 h-4 text-gray-400" />
            )}
            <span
              className={`text-sm font-medium ${
                suggestion.changePercent > 0
                  ? "text-green-600"
                  : suggestion.changePercent < 0
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {suggestion.changePercent > 0 ? "+" : ""}
              {suggestion.changePercent.toFixed(1)}% change
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              Confidence: {(suggestion.confidence * 100).toFixed(0)}%
            </span>
            {onPriceUpdate && (
              <button
                onClick={handleApplySuggestion}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Apply Price
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

