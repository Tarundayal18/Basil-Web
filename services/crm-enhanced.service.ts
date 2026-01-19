/**
 * Enhanced CRM Service
 * Enterprise-grade CRM functionality
 */

import { apiClient } from "@/lib/api";

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  anniversary?: string;
  billingAddress?: string;
  shippingAddress?: string;
  serviceLocation?: string;
  gstin?: string;
  customerType?: "RETAIL" | "WHOLESALE" | "CORPORATE" | "VIP";
  smsConsent?: boolean;
  whatsappConsent?: boolean;
  emailConsent?: boolean;
  preferredChannel?: "SMS" | "WHATSAPP" | "EMAIL";
  lifetimeValue?: number;
  firstInteractionDate?: string;
  lastInteractionDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  averageOrderValue?: number;
  purchaseFrequency?: number;
  assignedStoreId?: string;
  assignedManagerId?: string;
  segment?: string;
  behaviorScore?: number;
  tags?: string[];
  notes?: string;
}

export interface InteractionHistory {
  id: string;
  customerId: string;
  interactionType: string;
  channel: string;
  title: string;
  description?: string;
  amount?: number;
  orderId?: string;
  jobCardId?: string;
  campaignId?: string;
  interactionDate: string;
  metadata?: Record<string, any>;
}

export interface CustomerProductPreference {
  id: string;
  customerId: string;
  productId: string;
  totalQuantityPurchased: number;
  totalAmountSpent: number;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
  purchaseCount: number;
  averagePrice: number;
}

export interface TopCustomer {
  customerId: string;
  totalSpent: number;
  orderCount: number;
  customerName?: string; // Optional customer name from backend
}

export interface SlowMovingProduct {
  id: string;
  productId: string;
  storeId: string;
  totalQuantitySold: number;
  totalRevenue: number;
  lastSoldDate?: string;
}

export interface ChurnRiskCustomer {
  customerId: string;
  daysSinceLastPurchase: number;
  riskScore: number;
}

export interface FollowUp {
  id: string;
  storeId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  dueAt: string;
  dueDate: string;
  status: "OPEN" | "DONE" | "CANCELLED";
  title?: string;
  note?: string;
  assignedManagerId?: string;
  sourceInteractionId?: string;
}

export interface StaffPerformance {
  staffId: string;
  storeId: string;
  period: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  conversionRate: number;
  upsellCount: number;
  serviceCount?: number;
  averageResolutionTime?: number;
  averageRating?: number;
  reviewCount?: number;
}

export interface PeakHour {
  hour: number;
  orderCount: number;
  revenue: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  rules: {
    spendRange?: { min?: number; max?: number };
    purchaseFrequency?: { min?: number; max?: number };
    orderCount?: { min?: number; max?: number };
    categories?: string[];
    location?: string;
    lastPurchaseDays?: number;
    lifetimeValue?: { min?: number; max?: number };
    behaviorScore?: { min?: number; max?: number };
    customerType?: "RETAIL" | "WHOLESALE" | "CORPORATE" | "VIP";
  };
  isDynamic: boolean;
  lastUpdated?: string;
  customerCount?: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: "BULK" | "TRIGGER" | "DRIP";
  triggerType?: string;
  triggerDays?: number;
  triggerAmount?: number;
  segmentIds?: string[];
  customerIds?: string[];
  channel: "SMS" | "WHATSAPP" | "EMAIL" | "PUSH";
  message: string;
  offerId?: string;
  scheduledDate?: string;
  targetSegmentId?: string;
  isActive: boolean;
  dripSteps?: Array<{
    delayDays: number;
    message: string;
    offerId?: string;
  }>;
  sentCount?: number;
  openedCount?: number;
  clickedCount?: number;
  convertedCount?: number;
}

export interface Offer {
  id: string;
  name: string;
  code?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "BUY_X_GET_Y" | "FREE_SHIPPING";
  channel?: "SMS" | "WHATSAPP" | "EMAIL" | "PUSH";
  discountPercentage?: number;
  discountAmount?: number;
  minimumPurchase?: number;
  maximumDiscount?: number;
  applicableTo?: "ALL" | "CATEGORY" | "PRODUCT" | "BRAND";
  categoryIds?: string[];
  productIds?: string[];
  brandIds?: string[];
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  totalUsageLimit?: number;
  maxUsagePerCustomer?: number;
  targetSegmentId?: string;
  customerIds?: string[];
  segmentIds?: string[];
  autoSuggest: boolean;
  isActive?: boolean;
  priority?: number;
  usageCount?: number;
  totalDiscountGiven?: number;
}

export const crmEnhancedService = {
  /**
   * Get enhanced customer profile
   */
  async getCustomerProfile(customerId: string): Promise<CustomerProfile> {
    const response = await apiClient.get<CustomerProfile>(
      `/shopkeeper/crm/customers/${customerId}/profile`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch customer profile");
    }
    return response.data;
  },

  /**
   * Update customer profile
   */
  async updateCustomerProfile(
    customerId: string,
    updates: Partial<CustomerProfile>
  ): Promise<CustomerProfile> {
    const response = await apiClient.put<CustomerProfile>(
      `/shopkeeper/crm/customers/${customerId}/profile`,
      updates
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update customer profile");
    }
    return response.data;
  },

  /**
   * Get customer interaction timeline
   */
  async getCustomerTimeline(
    customerId: string,
    limit?: number,
    lastKey?: string
  ): Promise<{ items: InteractionHistory[]; lastKey?: string }> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (lastKey) params.lastKey = lastKey;

    const response = await apiClient.get<{ items: InteractionHistory[]; lastKey?: string }>(
      `/shopkeeper/crm/customers/${customerId}/timeline`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch customer timeline");
    }
    return response.data;
  },

  /**
   * Add interaction to customer timeline
   */
  async addInteraction(
    customerId: string,
    interaction: Omit<InteractionHistory, "id" | "customerId" | "interactionDate">
  ): Promise<InteractionHistory> {
    const response = await apiClient.post<InteractionHistory>(
      `/shopkeeper/crm/customers/${customerId}/interactions`,
      interaction
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to add interaction");
    }
    return response.data;
  },

  /**
   * Get customer product preferences
   */
  async getCustomerPreferences(
    customerId: string,
    limit?: number
  ): Promise<CustomerProductPreference[]> {
    const params: any = {};
    if (limit) params.limit = limit;

    const response = await apiClient.get<CustomerProductPreference[]>(
      `/shopkeeper/crm/customers/${customerId}/preferences`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch customer preferences");
    }
    return response.data;
  },

  /**
   * Get top customers by revenue
   */
  async getTopCustomers(
    limit?: number,
    fromDate?: string,
    toDate?: string
  ): Promise<TopCustomer[]> {
    const params: any = {};
    if (limit) params.limit = limit;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const response = await apiClient.get<TopCustomer[]>(
      `/shopkeeper/crm/reports/top-customers`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch top customers");
    }
    return response.data;
  },

  /**
   * Get slow-moving products
   */
  async getSlowMovingProducts(days?: number): Promise<SlowMovingProduct[]> {
    try {
      const params: any = {};
      if (days) params.days = days;

      const response = await apiClient.get<SlowMovingProduct[]>(
        `/shopkeeper/crm/reports/slow-moving`,
        params
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch slow-moving products");
      }
      return response.data || [];
    } catch (error) {
      // Re-throw with more context if it's not already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch slow-moving products: ${String(error)}`);
    }
  },

  /**
   * Get churn risk customers
   */
  async getChurnRiskCustomers(days?: number): Promise<ChurnRiskCustomer[]> {
    const params: any = {};
    if (days) params.days = days;

    const response = await apiClient.get<ChurnRiskCustomer[]>(
      `/shopkeeper/crm/reports/churn`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch churn risk customers");
    }
    return response.data;
  },

  /**
   * Get peak sales hours
   */
  async getPeakHours(
    fromDate?: string,
    toDate?: string
  ): Promise<PeakHour[]> {
    const params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;

    const response = await apiClient.get<PeakHour[]>(
      `/shopkeeper/crm/reports/peak-hours`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch peak hours");
    }
    return response.data;
  },

  /**
   * List segments
   */
  async listSegments(): Promise<CustomerSegment[]> {
    const response = await apiClient.get<CustomerSegment[]>(
      `/shopkeeper/crm/segments`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch segments");
    }
    return response.data;
  },

  /**
   * Create segment
   */
  async createSegment(segment: Omit<CustomerSegment, "id">): Promise<CustomerSegment> {
    const response = await apiClient.post<CustomerSegment>(
      `/shopkeeper/crm/segments`,
      segment
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create segment");
    }
    return response.data;
  },

  /**
   * Update segment
   */
  async updateSegment(
    segmentId: string,
    updates: Partial<CustomerSegment>
  ): Promise<CustomerSegment> {
    const response = await apiClient.put<CustomerSegment>(
      `/shopkeeper/crm/segments/${segmentId}`,
      updates
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update segment");
    }
    return response.data;
  },

  /**
   * Refresh segment members
   */
  async refreshSegment(segmentId: string): Promise<{ customerCount: number }> {
    const response = await apiClient.post<{ customerCount: number }>(
      `/shopkeeper/crm/segments/${segmentId}/refresh`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to refresh segment");
    }
    return response.data;
  },

  /**
   * Auto-refresh all dynamic segments
   */
  async autoRefreshAllSegments(): Promise<{ refreshed: number }> {
    const response = await apiClient.post<{ refreshed: number }>(
      `/shopkeeper/crm/segments/refresh-all`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to refresh all segments");
    }
    return response.data;
  },

  /**
   * Follow-ups pipeline
   */
  async listFollowUps(params: {
    storeId: string;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    status?: "OPEN" | "DONE" | "CANCELLED";
    assignedManagerId?: string;
    limit?: number;
  }): Promise<{ items: FollowUp[] }> {
    const response = await apiClient.get<{ items: FollowUp[] }>(
      `/shopkeeper/crm/follow-ups`,
      params as any
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch follow-ups");
    }
    return response.data;
  },

  async updateFollowUpStatus(
    followUpId: string,
    status: "OPEN" | "DONE" | "CANCELLED"
  ): Promise<void> {
    const response = await apiClient.patch<{ ok: boolean }>(
      `/shopkeeper/crm/follow-ups/${followUpId}`,
      { status }
    );
    if (!response.success) {
      throw new Error(response.error || "Failed to update follow-up");
    }
  },

  /**
   * List campaigns
   */
  async listCampaigns(): Promise<Campaign[]> {
    const response = await apiClient.get<Campaign[]>(
      `/shopkeeper/crm/campaigns`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch campaigns");
    }
    return response.data;
  },

  /**
   * Create campaign
   */
  async createCampaign(campaign: Omit<Campaign, "id">): Promise<Campaign> {
    const response = await apiClient.post<Campaign>(
      `/shopkeeper/crm/campaigns`,
      campaign
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create campaign");
    }
    return response.data;
  },

  /**
   * Update campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
    const response = await apiClient.put<Campaign>(
      `/shopkeeper/crm/campaigns/${campaignId}`,
      updates
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update campaign");
    }
    return response.data;
  },

  /**
   * Execute campaign
   */
  async executeCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    const response = await apiClient.post<{ sent: number; failed: number }>(
      `/shopkeeper/crm/campaigns/${campaignId}/execute`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to execute campaign");
    }
    return response.data;
  },

  /**
   * List offers
   */
  async listOffers(): Promise<Offer[]> {
    const response = await apiClient.get<Offer[]>(
      `/shopkeeper/crm/offers`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch offers");
    }
    return response.data;
  },

  /**
   * Create offer
   */
  async createOffer(offer: Omit<Offer, "id">): Promise<Offer> {
    const response = await apiClient.post<Offer>(
      `/shopkeeper/crm/offers`,
      offer
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create offer");
    }
    return response.data;
  },

  /**
   * Update offer
   */
  async updateOffer(
    offerId: string,
    updates: Partial<Offer>
  ): Promise<Offer> {
    const response = await apiClient.put<Offer>(
      `/shopkeeper/crm/offers/${offerId}`,
      updates
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update offer");
    }
    return response.data;
  },

  /**
   * Get suggested offers for customer
   */
  async getSuggestedOffers(
    customerId: string,
    orderAmount?: number
  ): Promise<Offer[]> {
    const params: any = {};
    if (orderAmount) params.orderAmount = orderAmount;

    const response = await apiClient.get<Offer[]>(
      `/shopkeeper/crm/customers/${customerId}/offers/suggestions`,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch suggested offers");
    }
    return response.data;
  },

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(
    staffId: string,
    period: string
  ): Promise<StaffPerformance> {
    const response = await apiClient.get<StaffPerformance>(
      `/shopkeeper/crm/staff/${staffId}/performance`,
      { period }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch staff performance");
    }
    return response.data;
  },
};

