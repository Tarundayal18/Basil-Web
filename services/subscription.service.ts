/**
 * Subscription Service
 * Handles subscription and payment related API calls
 */
import { apiClient } from "@/lib/api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  isActive: boolean;
  isMostPopular: boolean;
  sequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  storeId: string;
  planId: string;
  billingCycle: string;
  status: string;
  startDate: string;
  endDate?: string;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlan;
  isTrial?: boolean;
  orderCount?: number;
  maxOrders?: number;
  store: {
    id: string;
    name: string;
  };
}

export interface TrialSubscription {
  id: string;
  storeId: string;
  planId: null;
  billingCycle: null;
  status: "trial";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
  isTrial: true;
  orderCount: number;
  maxOrders: number;
  plan: null;
  store: {
    id: string;
    name: string;
  };
  payments: [];
}

export type SubscriptionOrTrial = Subscription | TrialSubscription;

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RegisterStoreRequest {
  storeId?: string; // Existing store ID (if adding subscription to existing store)
  name?: string; // Required only for new stores
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  planId?: string; // Optional for trial registrations
  billingCycle?: string; // monthly or annual - optional for trial registrations
  startTrial?: boolean;
  trialDays?: number;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trial {
  id: string;
  storeId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  store: Store;
}

export interface CreatePaymentOrderRequest {
  subscriptionId: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  subscriptionId: string;
}

export interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentMethod?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  subscription: {
    id: string;
    storeId: string;
    plan: {
      id: string;
      name: string;
    };
    store: {
      id: string;
      name: string;
    };
  };
}

export class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  static async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const response = await apiClient.get<SubscriptionPlan[]>(
      "/shopkeeper/subscription-plans"
    );
    return response.data || [];
  }

  /**
   * Register a new store with subscription
   */
  static async registerStore(data: RegisterStoreRequest): Promise<{
    store: Store;
    subscription?: Subscription;
    trial?: Trial;
    plan: SubscriptionPlan;
  }> {
    const response = await apiClient.post<{
      store: Store;
      subscription?: Subscription;
      trial?: Trial;
      plan: SubscriptionPlan;
    }>("/shopkeeper/stores/register", data);
    if (!response.data) {
      throw new Error(response.error || "Failed to register store");
    }
    return response.data;
  }

  /**
   * Get subscription for a store (or trial if no subscription exists)
   */
  static async getStoreSubscription(
    storeId: string
  ): Promise<SubscriptionOrTrial> {
    const response = await apiClient.get<SubscriptionOrTrial>(
      `/shopkeeper/stores/${storeId}/subscription`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get store subscription");
    }
    return response.data;
  }

  /**
   * Create payment order
   */
  static async createPaymentOrder(
    data: CreatePaymentOrderRequest
  ): Promise<PaymentOrder> {
    const response = await apiClient.post<PaymentOrder>(
      "/shopkeeper/payments/create-order",
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to create payment order");
    }
    return response.data;
  }

  /**
   * Verify payment
   */
  static async verifyPayment(data: VerifyPaymentRequest): Promise<{
    id: string;
    subscriptionId: string;
    amount: number;
    status: string;
  }> {
    const response = await apiClient.post<{
      id: string;
      subscriptionId: string;
      amount: number;
      status: string;
    }>("/shopkeeper/payments/verify", data);
    if (!response.data) {
      throw new Error(response.error || "Failed to verify payment");
    }
    return response.data;
  }

  /**
   * Get payments for shopkeeper's stores
   */
  static async getPayments(params?: {
    subscriptionId?: string;
    status?: string;
    storeId?: string;
  }): Promise<Payment[]> {
    const response = await apiClient.get<Payment[]>(
      "/shopkeeper/payments",
      params
    );
    return response.data || [];
  }

  /**
   * Update subscription (plan switch, auto-renew, etc.)
   */
  static async updateSubscription(
    subscriptionId: string,
    data: {
      planId?: string;
      billingCycle?: string;
      autoRenew?: boolean;
    }
  ): Promise<Subscription> {
    const response = await apiClient.put<Subscription>(
      `/shopkeeper/subscriptions/${subscriptionId}`,
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to update subscription");
    }
    return response.data;
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(
    subscriptionId: string
  ): Promise<Subscription> {
    const response = await apiClient.post<Subscription>(
      `/shopkeeper/subscriptions/${subscriptionId}/cancel`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to cancel subscription");
    }
    return response.data;
  }

  /**
   * Create payment order for plan switch
   */
  static async createPlanSwitchPaymentOrder(
    subscriptionId: string,
    newPlanId: string,
    billingCycle: string
  ): Promise<PaymentOrder> {
    const response = await apiClient.post<PaymentOrder>(
      "/shopkeeper/payments/create-order",
      {
        subscriptionId,
        planId: newPlanId,
        billingCycle,
      }
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to create plan switch payment order");
    }
    return response.data;
  }
}
