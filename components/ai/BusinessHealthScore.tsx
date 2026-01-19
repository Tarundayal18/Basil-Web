"use client";

import { useState, useEffect } from "react";
import { aiService, BusinessHealthScore } from "@/services/ai.service";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface BusinessHealthScoreProps {
  period?: "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  compact?: boolean;
}

export default function BusinessHealthScoreWidget({ period = "MONTH", compact = false }: BusinessHealthScoreProps) {
  const [healthScore, setHealthScore] = useState<BusinessHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHealthScore();
  }, [period]);

  const fetchHealthScore = async () => {
    try {
      setLoading(true);
      setError("");
      const score = await aiService.getBusinessHealthScore(period);
      setHealthScore(score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health score");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "GOOD":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "WARNING":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "CRITICAL":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "UP":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "DOWN":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
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

  if (!healthScore) return null;

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Business Health</h3>
          <span className={`text-xs font-medium px-2 py-1 rounded ${getScoreBgColor(healthScore.overallScore)} ${getScoreColor(healthScore.overallScore)}`}>
            {healthScore.overallScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${healthScore.overallScore >= 80 ? "bg-green-600" : healthScore.overallScore >= 60 ? "bg-yellow-600" : "bg-red-600"}`}
            style={{ width: `${healthScore.overallScore}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Business Health Score</h2>
        <select
          value={period}
          onChange={(e) => fetchHealthScore()}
          className="text-sm border border-gray-300 rounded px-3 py-1"
        >
          <option value="WEEK">This Week</option>
          <option value="MONTH">This Month</option>
          <option value="QUARTER">This Quarter</option>
          <option value="YEAR">This Year</option>
        </select>
      </div>

      {/* Overall Score */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className={`w-24 h-24 rounded-full ${getScoreBgColor(healthScore.overallScore)} flex items-center justify-center`}>
            <span className={`text-3xl font-bold ${getScoreColor(healthScore.overallScore)}`}>
              {healthScore.overallScore}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Overall Health Score</p>
            <p className="text-xs text-gray-500 mt-1">Based on 5 key metrics</p>
          </div>
        </div>
      </div>

      {/* Component Scores */}
      <div className="space-y-4 mb-6">
        {Object.entries(healthScore.components).map(([key, component]) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                {getStatusIcon(component.status)}
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(component.trend)}
                <span className="text-sm font-semibold text-gray-900">{component.score}/100</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  component.score >= 80 ? "bg-green-600" : component.score >= 60 ? "bg-yellow-600" : "bg-red-600"
                }`}
                style={{ width: `${component.score}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              Value: {typeof component.value === "number" ? component.value.toFixed(2) : component.value}
            </p>
          </div>
        ))}
      </div>

      {/* Insights */}
      {healthScore.insights && healthScore.insights.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Insights</h3>
          <ul className="space-y-1">
            {healthScore.insights.map((insight: string | { title?: string; description?: string; priority?: string }, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-indigo-600 mt-1">•</span>
                <span>
                  {typeof insight === "string" 
                    ? insight 
                    : insight.title || insight.description || JSON.stringify(insight)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {healthScore.recommendations && healthScore.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
          <ul className="space-y-2">
            {healthScore.recommendations.map((rec, index) => (
              <li key={index} className="text-sm border-l-2 pl-3 py-1" style={{
                borderColor: rec.priority === "HIGH" ? "#dc2626" : rec.priority === "MEDIUM" ? "#f59e0b" : "#10b981"
              }}>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{rec.title}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{rec.description}</div>
                    <div className="text-indigo-600 text-xs mt-1 font-medium">{rec.action}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    rec.priority === "HIGH" ? "bg-red-100 text-red-700" :
                    rec.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {rec.priority}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

