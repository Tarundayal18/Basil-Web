"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import ProtectedRoute from "@/components/ProtectedRoute";
import { crmService, CampaignHistory } from "@/services/crm.service";
import { crmEnhancedService, Campaign } from "@/services/crm-enhanced.service";
import { customersService } from "@/services/customers.service";
import { isCRMFeatureAvailable } from "@/lib/crm-feature-flags";
import ComingSoonFeature from "@/components/crm/ComingSoonFeature";
import { Megaphone, Search, Gift, Calendar, Plus } from "lucide-react";
import Toast from "@/components/Toast";
import Link from "next/link";

function CampaignsPageContent() {
  const { selectedStore } = useStore();
  const { track } = useAnalytics("Campaigns", true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<CampaignHistory[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [showCustomerView, setShowCustomerView] = useState(false);
  const [error, setError] = useState("");
  const [featureAvailable, setFeatureAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    checkFeatureAvailability();
  }, []);

  const checkFeatureAvailability = async () => {
    try {
      const available = await isCRMFeatureAvailable("campaigns");
      setFeatureAvailable(available);
      if (available) {
        loadAllCampaigns();
      }
    } catch (err) {
      console.error("Error checking feature availability:", err);
      setFeatureAvailable(false);
    }
  };

  useEffect(() => {
    if (selectedStore?.id && searchQuery.length >= 1) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchQuery, selectedStore]);

  useEffect(() => {
    if (selectedCustomer?.id) {
      loadCampaigns();
    }
  }, [selectedCustomer]);

  const searchCustomers = async () => {
    if (!selectedStore?.id) return;

    try {
      const response = await customersService.getCustomers({
        storeId: selectedStore.id,
        search: searchQuery,
        limit: 10,
      });
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Error searching customers:", err);
    }
  };

  const loadAllCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await crmEnhancedService.listCampaigns();
      setAllCampaigns(data);
    } catch (err: any) {
      console.error("Error loading campaigns:", err);
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!selectedCustomer?.id) return;

    try {
      setLoading(true);
      setError("");
      const data = await crmService.getCampaigns(selectedCustomer.id);
      setCampaigns(data);
      track("campaigns_viewed", {
        customerId: selectedCustomer.id,
        count: data.length,
      });
    } catch (err: any) {
      console.error("Error loading campaigns:", err);
      setError(err.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  // Show coming soon if feature is not available
  if (featureAvailable === false) {
    return (
      <ComingSoonFeature
        featureName="Marketing Campaigns"
        description="Create and manage marketing campaigns to engage customers through SMS, WhatsApp, Email, and Push notifications."
        backUrl="/crm"
      />
    );
  }

  if (!selectedStore) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a store to view campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaigns</h1>
            <p className="text-gray-600">
              View and manage marketing campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustomerView(!showCustomerView)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showCustomerView ? "View All Campaigns" : "View Customer History"}
            </button>
            <Link
              href="/crm/campaigns/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Link>
          </div>
        </div>
      </div>

      {showCustomerView ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Search */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Customer</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {customers.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setSearchQuery("");
                    setCustomers([]);
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? "bg-indigo-50 border-indigo-300"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign History */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {selectedCustomer ? (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedCustomer.name}
                </h2>
                <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading campaigns...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No campaigns found for this customer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.campaignId}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Megaphone className="h-5 w-5 text-pink-500" />
                            <h3 className="font-semibold text-gray-900">
                              {campaign.campaignType || "Campaign"}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                campaign.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : campaign.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                          {campaign.reward && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Gift className="h-4 w-4" />
                              <span>Reward: {JSON.stringify(campaign.reward)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Search and select a customer to view campaign history</p>
            </div>
          )}
        </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading campaigns...</p>
            </div>
          ) : allCampaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No campaigns found</p>
              <Link
                href="/crm/campaigns/new"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Campaign
              </Link>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.type}</div>
                      {campaign.type === "TRIGGER" && campaign.triggerType && (
                        <div className="text-xs text-blue-600 mt-1">
                          {campaign.triggerType.replace(/_/g, " ")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.channel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {campaign.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.sentCount || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/crm/campaigns/${campaign.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default function CampaignsPage() {
  return (
    <ProtectedRoute>
      <CampaignsPageContent />
    </ProtectedRoute>
  );
}

