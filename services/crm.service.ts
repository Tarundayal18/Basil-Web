import { apiClient } from "@/lib/api";

export interface WalletTransaction {
  txnId: string;
  customerId: string;
  amount: number;
  remark?: string;
  createdAt: string;
  orderId?: string;
}

export interface WalletBalance {
  transactions: WalletTransaction[];
  balance: number;
}

export interface CreditLedgerEntry {
  entryId: string;
  customerId: string;
  amount: number;
  remark?: string;
  createdAt: string;
  orderId?: string;
}

export interface CreditLedger {
  entries: CreditLedgerEntry[];
  outstanding: number;
}

export interface LoyaltyPoints {
  customerId: string;
  points: number;
  totalEarned?: number;
  totalRedeemed?: number;
  updatedAt: string;
}

export interface CampaignHistory {
  campaignId: string;
  customerId: string;
  campaignType: string;
  status: string;
  reward?: any;
  createdAt: string;
}

export const crmService = {
  // Wallet
  async getWallet(customerId: string): Promise<WalletBalance> {
    const response = await apiClient.get<WalletBalance>(
      `/shopkeeper/crm/customers/${customerId}/wallet`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get wallet");
    }
    return response.data;
  },

  async addWalletTransaction(
    customerId: string,
    data: { amount: number; remark?: string; orderId?: string }
  ): Promise<WalletBalance> {
    const response = await apiClient.post<WalletBalance>(
      `/shopkeeper/crm/customers/${customerId}/wallet`,
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to add wallet transaction");
    }
    return response.data;
  },

  // Credit Ledger
  async getCreditLedger(customerId: string): Promise<CreditLedger> {
    const response = await apiClient.get<CreditLedger>(
      `/shopkeeper/crm/customers/${customerId}/credit`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get credit ledger");
    }
    return response.data;
  },

  async addCreditEntry(
    customerId: string,
    data: { amount: number; remark?: string; orderId?: string }
  ): Promise<CreditLedger> {
    const response = await apiClient.post<CreditLedger>(
      `/shopkeeper/crm/customers/${customerId}/credit`,
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to add credit entry");
    }
    return response.data;
  },

  // Loyalty Points
  async getLoyalty(customerId: string): Promise<LoyaltyPoints> {
    const response = await apiClient.get<LoyaltyPoints>(
      `/shopkeeper/crm/customers/${customerId}/loyalty`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get loyalty points");
    }
    return response.data;
  },

  async addLoyaltyPoints(
    customerId: string,
    data: { points: number }
  ): Promise<LoyaltyPoints> {
    const response = await apiClient.post<LoyaltyPoints>(
      `/shopkeeper/crm/customers/${customerId}/loyalty`,
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to add loyalty points");
    }
    return response.data;
  },

  async redeemLoyaltyPoints(
    customerId: string,
    data: { points: number }
  ): Promise<LoyaltyPoints> {
    const response = await apiClient.post<LoyaltyPoints>(
      `/shopkeeper/crm/customers/${customerId}/loyalty/redeem`,
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to redeem loyalty points");
    }
    return response.data;
  },

  // Campaigns
  async getCampaigns(customerId: string): Promise<CampaignHistory[]> {
    const response = await apiClient.get<CampaignHistory[]>(
      `/shopkeeper/crm/customers/${customerId}/campaigns`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get campaigns");
    }
    return response.data;
  },
};

