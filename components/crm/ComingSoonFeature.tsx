/**
 * Coming Soon Feature Component
 * Displays a friendly message when a feature is not yet available
 */

"use client";

import { Construction, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

interface ComingSoonFeatureProps {
  featureName?: string;
  description?: string;
  estimatedDate?: string;
  showBackButton?: boolean;
  backUrl?: string;
}

export default function ComingSoonFeature({
  featureName = "This Feature",
  description = "We're working hard to bring you this feature. It will be available soon!",
  estimatedDate,
  showBackButton = true,
  backUrl = "/crm",
}: ComingSoonFeatureProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full">
              <Construction className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {featureName} Coming Soon
        </h1>

        <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
          {description}
        </p>

        {estimatedDate && (
          <div className="flex items-center justify-center gap-2 text-indigo-600 mb-8">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Estimated: {estimatedDate}</span>
          </div>
        )}

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What to Expect</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">✓</span>
                  <span>Enterprise-grade functionality</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">✓</span>
                  <span>Seamless integration with existing features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600">✓</span>
                  <span>Best-in-class user experience</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {showBackButton && (
          <Link
            href={backUrl}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to CRM Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}
