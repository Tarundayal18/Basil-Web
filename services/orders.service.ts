import { apiClient } from "@/lib/api";

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  discountPercentage?: number | null;
  subtotal: number;
  taxPercentage?: number | null;
  hsnCode?: string | null;
  productName?: string | null; // Denormalized product name (fallback if product is null)
  product: {
    id: string;
    name: string;
    barcode?: string;
  } | null;
}

export interface Order {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  orderItems: OrderItem[];
  store?: {
    id: string;
    name: string;
  };
  bill?: {
    id: string;
    billNumber: string;
    pdfUrl?: string | null;
    pdfStatus?: "QUEUED" | "READY" | "FAILED" | "NONE" | string;
  };
}

export interface CreateOrderData {
  storeId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerGstin?: string;
  billingAddress?: string;
  placeOfSupply?: string;
  orderType?: string;
  printMode?: "a4" | "receipt";
  overallDiscount?: number; // Overall discount percentage on entire bill
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    discountPercentage?: number;
    taxPercentage?: number; // Allow custom tax percentage per item
  }>;
}

export interface OrdersResponse {
  data: Order[];
  pagination: {
    limit: number;
    lastKey?: string | null;
    hasMore: boolean;
  };
}

export const ordersService = {
  async getOrders(params?: {
    limit?: number;
    lastKey?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    storeId?: string;
  }): Promise<OrdersResponse> {
    const storeId = params?.storeId?.trim();
    // Preferred (after backend deploy): store-scoped path avoids query-param forwarding issues.
    // Backward compatible: if the backend isn't deployed yet, API Gateway may return a non-CORS
    // default response (browser shows "Failed to fetch"). In that case, fall back to legacy route.
    const { storeId: _ignore, ...query } = params || {};

    let response: Awaited<ReturnType<typeof apiClient.get<OrdersResponse>>>;
    if (storeId) {
      try {
        response = await apiClient.get<OrdersResponse>(
          `/shopkeeper/orders/store/${encodeURIComponent(storeId)}`,
          query,
          { cache: "no-store" }
        );
      } catch (e) {
        // Fallback: legacy query-param API
        response = await apiClient.get<OrdersResponse>(
          "/shopkeeper/orders",
          { ...query, storeId },
          { cache: "no-store" }
        );
      }
    } else {
      response = await apiClient.get<OrdersResponse>("/shopkeeper/orders", query, {
        cache: "no-store",
      });
    }
    if (!response.data) {
      throw new Error(response.error || "Failed to get orders");
    }
    return response.data;
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/shopkeeper/orders/${id}`);
    if (!response.data) {
      throw new Error(response.error || "Failed to get order");
    }
    return response.data;
  },

  async getBillDownloadUrl(orderId: string): Promise<{
    downloadUrl: string;
    expiresIn: number;
    filename?: string;
  }> {
    const response = await apiClient.get<{
      downloadUrl: string;
      expiresIn: number;
      filename?: string;
    }>(`/shopkeeper/download/bill/${orderId}`);

    if (!response.data?.downloadUrl) {
      throw new Error(response.error || "Failed to get download URL");
    }
    return response.data;
  },

  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post<Order>("/shopkeeper/orders", data);
    if (!response.data) {
      throw new Error("Failed to create order: No data returned");
    }
    return response.data;
  },

  /**
   * Downloads a bill PDF by fetching a presigned URL from the API
   * and then downloading the PDF from S3 using that URL.
   * @param pdfUrl - The original PDF URL (not used, kept for compatibility)
   * @param billNumber - The bill number for the filename
   * @param orderId - The order ID to fetch the presigned URL
   */
  async downloadBillPdf(
    pdfUrl: string,
    billNumber: string,
    orderId: string
  ): Promise<void> {
    try {
      // Get presigned URL from the API
      const response = await apiClient.get<{
        downloadUrl: string;
        expiresIn: number;
        filename: string;
      }>(`/shopkeeper/download/bill/${orderId}`);

      if (!response.data?.downloadUrl) {
        throw new Error("Failed to get download URL");
      }

      // Download the PDF from the presigned URL
      const pdfResponse = await fetch(response.data.downloadUrl);
      if (!pdfResponse.ok) {
        throw new Error("Failed to download PDF from S3");
      }

      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${billNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to download PDF"
      );
    }
  },

  async generateBill(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(
      `/shopkeeper/orders/${orderId}/generate-bill`
    );
    if (!response.data) {
      throw new Error("Failed to generate bill: No data returned");
    }
    return response.data;
  },

  /**
   * Sends invoice via WhatsApp
   * @param billId - The bill/order ID
   */
  async sendWhatsApp(
    billId: string,
    storeId?: string
  ): Promise<{ billId: string; whatsappSent: boolean }> {
    const url = storeId
      ? `/shopkeeper/bills/${billId}/resend-whatsapp?storeId=${encodeURIComponent(
          storeId
        )}`
      : `/shopkeeper/bills/${billId}/resend-whatsapp`;
    const response = await apiClient.post<{ billId: string; whatsappSent: boolean }>(
      url
    );
    if (!response.data) {
      throw new Error("Failed to send WhatsApp: No data returned");
    }
    return response.data;
  },

  /**
   * Sends invoice via Email
   * @param billId - The bill/order ID
   */
  async sendEmail(
    billId: string,
    storeId?: string
  ): Promise<{ billId: string; emailSent: boolean }> {
    const url = storeId
      ? `/shopkeeper/bills/${billId}/send-email?storeId=${encodeURIComponent(
          storeId
        )}`
      : `/shopkeeper/bills/${billId}/send-email`;
    const response = await apiClient.post<{ billId: string; emailSent: boolean }>(
      url
    );
    if (!response.data) {
      throw new Error("Failed to send email: No data returned");
    }
    return response.data;
  },
};
