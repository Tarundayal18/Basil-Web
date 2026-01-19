/**
 * Quotes Service
 * Enterprise-grade quote management with country-aware tax support
 */

import { apiClient } from "@/lib/api";

export interface Quote {
  quoteId: string;
  quoteNumber: string;
  storeId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstin?: string; // India only
  customerVatId?: string; // EU only
  billingAddress?: string;
  placeOfSupply?: string; // India only
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "REJECTED";
  validUntil?: string;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    discountPercentage?: number;
    subtotal: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteRequest {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstin?: string; // India only
  customerVatId?: string; // EU only
  billingAddress?: string;
  placeOfSupply?: string; // India only
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    discountPercentage?: number;
  }>;
  validUntil?: string;
  notes?: string;
}

export interface UpdateQuoteRequest {
  status?: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "REJECTED";
  notes?: string;
}

class QuotesService {
  /**
   * Create a quote
   */
  async createQuote(
    storeId: string,
    data: CreateQuoteRequest
  ): Promise<Quote> {
    const response = await apiClient.post<Quote>(
      `/shopkeeper/quotes`,
      {
        ...data,
        storeId,
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create quote");
    }
    return response.data;
  }

  /**
   * Get quotes for a store
   */
  async getQuotes(
    storeId: string,
    params?: {
      status?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<Quote[]> {
    const response = await apiClient.get<{ quotes: Quote[] }>(
      `/shopkeeper/quotes`,
      {
        storeId,
        ...params,
      }
    );
    return response.data?.quotes || [];
  }

  /**
   * Get a specific quote
   */
  async getQuote(
    storeId: string,
    quoteId: string
  ): Promise<Quote> {
    const response = await apiClient.get<{ quote: Quote }>(
      `/shopkeeper/quotes/${quoteId}`,
      {
        storeId,
      }
    );
    if (!response.success || !response.data?.quote) {
      throw new Error(response.error || "Failed to fetch quote");
    }
    return response.data.quote;
  }

  /**
   * Update a quote
   */
  async updateQuote(
    storeId: string,
    quoteId: string,
    data: UpdateQuoteRequest
  ): Promise<Quote> {
    const response = await apiClient.put<Quote>(
      `/shopkeeper/quotes/${quoteId}`,
      {
        ...data,
        storeId,
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update quote");
    }
    return response.data;
  }

  /**
   * Convert quote to invoice
   */
  async convertToInvoice(
    storeId: string,
    quoteId: string
  ): Promise<{ invoiceId: string; invoiceNumber: string }> {
    const response = await apiClient.post<{ invoiceId: string; invoiceNumber: string }>(
      `/quotes/${quoteId}/convert`,
      {
        storeId,
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to convert quote to invoice");
    }
    return response.data;
  }
}

export const quotesService = new QuotesService();
