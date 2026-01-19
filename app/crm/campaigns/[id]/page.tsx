/**
 * Campaign Details Page
 * View and manage campaign details, analytics, and execution
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmEnhancedService, Campaign } from "@/services/crm-enhanced.service";
import Toast from "@/components/Toast";
import Link from "next/link";

export default function CampaignDetailsPage() {
  return (
    <ProtectedRoute>
      <CampaignDetailsContent />
    </ProtectedRoute>
  );
}

function CampaignDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      setError("");
      const campaigns = await crmEnhancedService.listCampaigns();
      const found = campaigns.find((c) => c.id === campaignId);
      if (found) {
        setCampaign(found);
      } else {
        setError("Campaign not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!campaignId) return;

    try {
      setExecuting(true);
      setError("");
      const result = await crmEnhancedService.executeCampaign(campaignId);
      setError(`Campaign executed: ${result.sent} sent, ${result.failed} failed`);
      loadCampaign(); // Refresh to get updated metrics
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute campaign");
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.push("/crm/campaigns")}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600 mt-1">
              {campaign.type} Campaign • {campaign.channel}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExecute}
              disabled={executing || !campaign.isActive}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {executing ? "Executing..." : "Execute Campaign"}
            </button>
            <Link
              href="/crm/campaigns"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="text-gray-900 font-medium">{campaign.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Channel</p>
                <p className="text-gray-900 font-medium">{campaign.channel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Message</p>
                <p className="text-gray-900 whitespace-pre-wrap">{campaign.message}</p>
              </div>
              {campaign.triggerType && (
                <div>
                  <p className="text-sm text-gray-600">Trigger</p>
                  <p className="text-gray-900 font-medium">{campaign.triggerType}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    campaign.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-gray-900">{campaign.sentCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Opened</p>
                <p className="text-2xl font-bold text-gray-900">{campaign.openedCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Clicked</p>
                <p className="text-2xl font-bold text-gray-900">{campaign.clickedCount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-gray-900">{campaign.convertedCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Toast
        message={error}
        type="error"
        isOpen={!!error}
        onClose={() => setError("")}
      />
    </div>
  );
}

