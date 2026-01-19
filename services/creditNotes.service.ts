/**
 * Credit Notes Service
 * Enterprise-grade credit note management
 */

import { apiClient } from "@/lib/api";

export interface CreditNote {
  id: string;
  storeId: string;
  originalInvoiceId: string;
  creditNoteNumber: string;
  creditNoteDate: string;
  reason: string;
  notes?: string;
  customerId?: string;
  customerName?: string;
  customerGstin?: string;
  placeOfSupply?: string;
  totalTaxableValue: number; // Negative
  totalCGST: number; // Negative
  totalSGST: number; // Negative
  totalIGST: number; // Negative
  totalCess: number; // Negative
  totalGST: number; // Negative
  totalAmount: number; // Negative
  status: "ISSUED" | "CANCELLED";
  items: Array<{
    originalItemId: string;
    productId: string;
    productName: string;
    quantity: number;
    taxableValue: number; // Negative
    cgstAmount: number; // Negative
    sgstAmount: number; // Negative
    igstAmount: number; // Negative
    totalAmount: number; // Negative
  }>;
}

export interface CreateCreditNoteRequest {
  originalInvoiceId: string;
  items: Array<{
    originalItemId: string;
    quantity: number;
  }>;
  reason: string;
  notes?: string;
}

class CreditNotesService {
  /**
   * Create a credit note
   */
  async createCreditNote(
    storeId: string,
    data: CreateCreditNoteRequest
  ): Promise<CreditNote> {
    const response = await apiClient.post<CreditNote>(
      `/shopkeeper/credit-notes`,
      {
        ...data,
        storeId,
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create credit note");
    }
    return response.data;
  }

  /**
   * Get credit notes for a store
   */
  async getCreditNotes(
    storeId: string,
    params?: {
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<CreditNote[]> {
    const response = await apiClient.get<CreditNote[]>(
      `/shopkeeper/credit-notes`,
      {
        storeId,
        ...params,
      }
    );
    return response.data || [];
  }

  /**
   * Get credit notes for a specific invoice
   */
  async getCreditNotesForInvoice(
    storeId: string,
    invoiceId: string
  ): Promise<CreditNote[]> {
    const response = await apiClient.get<CreditNote[]>(
      `/shopkeeper/invoices/${invoiceId}/credit-notes`,
      {
        storeId,
      }
    );
    return response.data || [];
  }

  /**
   * Get a specific credit note
   */
  async getCreditNote(
    storeId: string,
    creditNoteId: string
  ): Promise<CreditNote> {
    const response = await apiClient.get<CreditNote>(
      `/shopkeeper/credit-notes/${creditNoteId}`,
      {
        storeId,
      }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch credit note");
    }
    return response.data;
  }
}

export const creditNotesService = new CreditNotesService();
