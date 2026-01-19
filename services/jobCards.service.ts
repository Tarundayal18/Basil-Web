import { apiClient } from "@/lib/api";

// Job Card Types - Matching Backend Types
export type JobCardStatus =
  | "CREATED"
  | "INSPECTION"
  | "ESTIMATE_SENT"
  | "APPROVED"
  | "IN_PROGRESS"
  | "WAITING_FOR_PARTS"
  | "QC_CHECK"
  | "READY_FOR_DELIVERY"
  | "CLOSED"
  | "CANCELLED";

export type JobCardPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// Backend uses: LABOR, PART, FEE (not MATERIAL, EXPENSE)
export type JobCardItemKind = "LABOR" | "PART" | "FEE";

export interface CustomerInfo {
  customerId?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    postcode?: string;
    state?: string;
    country?: string;
  };
}

export interface VehicleInfo {
  regNo?: string;
  make?: string;
  model?: string;
  vin?: string;
  year?: number;
  variant?: string;
  fuelType?: "PETROL" | "DIESEL" | "CNG" | "LPG" | "ELECTRIC" | "HYBRID";
  manufacturingYear?: number;
  registrationYear?: number;
  engineNumber?: string;
  chassisNumber?: string;
  vehicleType?: "2W" | "3W" | "4W" | "CV";
  odometer?: number;
  fuelLevel?: string;
}

export interface JobCard {
  jobCardId: string;
  jobCardNumber: string;
  storeId: string;
  title: string;
  status: JobCardStatus;
  priority: JobCardPriority;
  customer: CustomerInfo;
  vehicle?: VehicleInfo;
  notes?: string;
  internalNotes?: string;
  serviceType?: string;
  serviceDescription?: string;
  location?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  laborCost?: number;
  materialsCost?: number;
  totalCost?: number;
  assignedToUserId?: string;
  assignedToName?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  workStartedAt?: string;
  workCompletedAt?: string;
  deliveredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
  timeline?: Array<{
    eventId: string;
    description: string;
    performedByName?: string;
    createdAt: string;
  }>;
  // Enhanced fields
  odometerReading?: number;
  fuelLevel?: string;
  customerComplaints?: string;
  warrantyStatus?: "IN_WARRANTY" | "OUT_OF_WARRANTY" | "EXTENDED";
  warrantyExpiryDate?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceClaimNumber?: string;
}

export interface JobCardItem {
  itemId: string;
  jobCardId: string;
  kind: JobCardItemKind;
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobCardInput {
  title: string;
  customer: CustomerInfo;
  vehicle?: VehicleInfo;
  notes?: string;
  serviceType?: string;
  serviceDescription?: string;
  location?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  priority?: JobCardPriority;
  scheduledDate?: string;
  scheduledTime?: string;
  odometerReading?: number;
  fuelLevel?: string;
  customerComplaints?: string;
  warrantyStatus?: "IN_WARRANTY" | "OUT_OF_WARRANTY" | "EXTENDED";
  warrantyExpiryDate?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceClaimNumber?: string;
}

export interface UpdateJobCardStatusInput {
  status: JobCardStatus;
  notes?: string;
}

export interface CreateJobCardItemInput {
  kind: JobCardItemKind;
  name: string;
  description?: string;
  qty: number;
  unitPrice: number;
  taxRate?: number;
}

export interface UpdateJobCardItemInput {
  name?: string;
  description?: string;
  qty?: number;
  unitPrice?: number;
  taxRate?: number;
}

export interface JobCardsListResponse {
  items: JobCard[];
  pagination: {
    limit: number;
    lastKey: string | null;
    hasMore: boolean;
  };
}

export const jobCardsService = {
  /**
   * List job cards
   */
  async listJobCards(params?: {
    limit?: number;
    lastKey?: string;
    status?: JobCardStatus;
    fromDate?: string;
    toDate?: string;
  }): Promise<JobCardsListResponse> {
    const response = await apiClient.get<JobCardsListResponse>("/jobcards", params);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch job cards");
    }
    return response.data;
  },

  /**
   * Get a single job card
   */
  async getJobCard(jobCardId: string): Promise<JobCard> {
    const response = await apiClient.get<{ jobCard: JobCard }>(
      `/jobcards/${jobCardId}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch job card");
    }
    return response.data.jobCard;
  },

  /**
   * Create a new job card
   */
  async createJobCard(data: CreateJobCardInput): Promise<JobCard> {
    const response = await apiClient.post<{ jobCard: JobCard }>("/jobcards", data);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create job card");
    }
    return response.data.jobCard;
  },

  /**
   * Update job card status
   */
  async updateJobCardStatus(
    jobCardId: string,
    data: UpdateJobCardStatusInput
  ): Promise<JobCard> {
    const response = await apiClient.post<{ jobCard: JobCard }>(
      `/jobcards/${jobCardId}/status`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update job card status");
    }
    return response.data.jobCard;
  },

  /**
   * List job card items
   */
  async listJobCardItems(jobCardId: string): Promise<JobCardItem[]> {
    const response = await apiClient.get<{ items: JobCardItem[] }>(
      `/jobcards/${jobCardId}/items`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch job card items");
    }
    return response.data.items;
  },

  /**
   * Create a job card item
   */
  async createJobCardItem(
    jobCardId: string,
    data: CreateJobCardItemInput
  ): Promise<JobCardItem> {
    const response = await apiClient.post<{ item: JobCardItem }>(
      `/jobcards/${jobCardId}/items`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create job card item");
    }
    return response.data.item;
  },

  /**
   * Update a job card item
   */
  async updateJobCardItem(
    jobCardId: string,
    itemId: string,
    data: UpdateJobCardItemInput
  ): Promise<JobCardItem> {
    const response = await apiClient.post<{ item: JobCardItem }>(
      `/jobcards/${jobCardId}/items/${itemId}`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update job card item");
    }
    return response.data.item;
  },

  /**
   * Approve or reject a job card item
   */
  async approveJobCardItem(
    jobCardId: string,
    itemId: string,
    status: "APPROVED" | "REJECTED"
  ): Promise<JobCardItem> {
    const response = await apiClient.post<{ item: JobCardItem }>(
      `/jobcards/${jobCardId}/items/${itemId}/approval`,
      { status }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to approve/reject item");
    }
    return response.data.item;
  },

  /**
   * Generate invoice for job card
   */
  async generateInvoice(jobCardId: string): Promise<void> {
    const response = await apiClient.post(`/jobcards/${jobCardId}/invoice`, {});
    if (!response.success) {
      throw new Error(response.error || "Failed to generate invoice");
    }
  },

  /**
   * Get customer job cards
   */
  async getCustomerJobCards(
    customerId: string,
    params?: {
      storeId?: string;
      status?: JobCardStatus;
      limit?: number;
      lastKey?: string;
    }
  ): Promise<JobCardsListResponse> {
    try {
      const response = await apiClient.get<JobCardsListResponse>(
        `/jobcards/customers/${customerId}/history`,
        params as any
      );
      
      // If response is successful, return data (even if empty array)
      if (response.success) {
        return response.data || { items: [], pagination: { limit: 50, lastKey: null, hasMore: false } };
      }
      
      // If not successful but no error message, return empty result
      if (!response.error) {
        return { items: [], pagination: { limit: 50, lastKey: null, hasMore: false } };
      }
      
      throw new Error(response.error || "Failed to fetch customer job cards");
    } catch (error) {
      // If it's a 404 or "not found" error, return empty array instead of throwing
      if (error instanceof Error && (
        error.message.includes("not found") || 
        error.message.includes("404") ||
        error.message.includes("Job card not found")
      )) {
        return { items: [], pagination: { limit: 50, lastKey: null, hasMore: false } };
      }
      // Re-throw other errors
      throw error;
    }
  },

  /**
   * Get customer analytics
   */
  async getCustomerAnalytics(customerId: string): Promise<{
    totalJobCards: number;
    totalValue: number;
    averageValue: number;
    lastVisitDate: string | null;
    firstVisitDate: string | null;
    statusBreakdown: Record<string, number>;
  }> {
    const response = await apiClient.get<{
      analytics: {
        totalJobCards: number;
        totalValue: number;
        averageValue: number;
        lastVisitDate: string | null;
        firstVisitDate: string | null;
        statusBreakdown: Record<string, number>;
      };
    }>(`/jobcards/customers/${customerId}/analytics`);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch customer analytics");
    }
    return response.data.analytics;
  },

  // ============================================
  // INSPECTION CHECKLIST APIs
  // ============================================

  async getInspectionChecklist(jobCardId: string): Promise<{
    checklist: {
      checklistId: string;
      checklistName: string;
      checklistVersion?: string;
      items: Array<{
        itemId: string;
        checkpointName: string;
        category?: string;
        status: "PENDING" | "PASS" | "FAIL" | "NOT_APPLICABLE";
        technicianRemarks?: string;
        photos?: string[];
        videos?: string[];
        checkedAt?: string;
        checkedBy?: string;
      }>;
      completedAt?: string;
      completedBy?: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    const response = await apiClient.get<{
      checklist: any;
    }>(`/jobcards/${jobCardId}/inspection`);
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch inspection checklist");
    }
    return response.data;
  },

  async createInspectionChecklist(
    jobCardId: string,
    data: {
      checklistName: string;
      checklistVersion?: string;
      brandId?: string;
      modelId?: string;
      items: Array<{
        checkpointName: string;
        category?: string;
      }>;
    }
  ): Promise<{ checklist: any }> {
    const response = await apiClient.post<{ checklist: any }>(
      `/jobcards/${jobCardId}/inspection`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create inspection checklist");
    }
    return response.data;
  },

  async updateInspectionItem(
    jobCardId: string,
    itemId: string,
    data: {
      status?: "PENDING" | "PASS" | "FAIL" | "NOT_APPLICABLE";
      technicianRemarks?: string;
      photos?: string[];
      videos?: string[];
    }
  ): Promise<{ checklist: any }> {
    const response = await apiClient.patch<{ checklist: any }>(
      `/jobcards/${jobCardId}/inspection/items/${itemId}`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update inspection item");
    }
    return response.data;
  },

  // ============================================
  // ESTIMATE APIs
  // ============================================

  async getAllEstimates(jobCardId: string): Promise<{
    estimates: Array<{
      estimateId: string;
      version: number;
      status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
      estimateNumber: string;
      items: Array<{
        itemId: string;
        kind: "LABOR" | "PART";
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        discountPercentage?: number;
        baseAmount: number;
        taxAmount: number;
        totalAmount: number;
      }>;
      subTotal: number;
      taxTotal: number;
      grandTotal: number;
      taxBreakup: Array<{
        taxRate: number;
        taxableAmount: number;
        taxAmount: number;
      }>;
      approvalMethod?: "OTP" | "WHATSAPP" | "EMAIL" | "SIGNATURE" | "MANUAL";
      approvedAt?: string;
      approvedBy?: string;
      sentAt?: string;
      expiresAt?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    const response = await apiClient.get<{ estimates: any[] }>(
      `/jobcards/${jobCardId}/estimates`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch estimates");
    }
    return response.data;
  },

  async getLatestEstimate(jobCardId: string): Promise<{
    estimate: {
      estimateId: string;
      version: number;
      status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED";
      estimateNumber: string;
      items: Array<{
        itemId: string;
        kind: "LABOR" | "PART";
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        discountPercentage?: number;
        baseAmount: number;
        taxAmount: number;
        totalAmount: number;
      }>;
      subTotal: number;
      taxTotal: number;
      grandTotal: number;
      taxBreakup: Array<{
        taxRate: number;
        taxableAmount: number;
        taxAmount: number;
      }>;
      approvalMethod?: "OTP" | "WHATSAPP" | "EMAIL" | "SIGNATURE" | "MANUAL";
      approvedAt?: string;
      approvedBy?: string;
      sentAt?: string;
      expiresAt?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    const response = await apiClient.get<{ estimate: any }>(
      `/jobcards/${jobCardId}/estimates/latest`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch latest estimate");
    }
    return response.data;
  },

  async createEstimate(
    jobCardId: string,
    data: {
      items: Array<{
        kind: "LABOR" | "PART";
        name: string;
        description?: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number;
        discountPercentage?: number;
      }>;
      notes?: string;
      expiresInDays?: number;
    }
  ): Promise<{ estimate: any }> {
    const response = await apiClient.post<{ estimate: any }>(
      `/jobcards/${jobCardId}/estimates`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create estimate");
    }
    return response.data;
  },

  async sendEstimate(
    jobCardId: string,
    estimateId: string,
    data: {
      approvalMethod: "OTP" | "WHATSAPP" | "EMAIL" | "SIGNATURE" | "MANUAL";
      customerPhone?: string;
      customerEmail?: string;
    }
  ): Promise<{ estimate: any }> {
    const response = await apiClient.post<{ estimate: any }>(
      `/jobcards/${jobCardId}/estimates/${estimateId}/send`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to send estimate");
    }
    return response.data;
  },

  async approveEstimate(
    jobCardId: string,
    estimateId: string,
    data: {
      approvalMethod: "OTP" | "WHATSAPP" | "EMAIL" | "SIGNATURE" | "MANUAL";
      otp?: string;
      signature?: string;
      approvedBy?: string;
    }
  ): Promise<{ estimate: any }> {
    const response = await apiClient.post<{ estimate: any }>(
      `/jobcards/${jobCardId}/estimates/${estimateId}/approve`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to approve estimate");
    }
    return response.data;
  },

  async rejectEstimate(
    jobCardId: string,
    estimateId: string,
    data: {
      reason: string;
      rejectedBy?: string;
    }
  ): Promise<{ estimate: any }> {
    const response = await apiClient.post<{ estimate: any }>(
      `/jobcards/${jobCardId}/estimates/${estimateId}/reject`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to reject estimate");
    }
    return response.data;
  },
};

