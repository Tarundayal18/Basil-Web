import { apiClient } from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gstin?: string; // India only
  vatId?: string; // EU only (Netherlands, Germany)
  billingAddress?: string;
  customerType?: "retail" | "wholesale" | "corporate" | "vip";
  segment?: string; // dynamic segment name
  tags?: string[];
  ordersCount?: number;
  lifetimeValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: {
    limit: number;
    lastKey?: string | null;
    hasMore: boolean;
  };
}

export interface CustomerDetails extends Customer {
  orders: Array<{
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    bill?: {
      id: string;
      billNumber: string;
      pdfUrl?: string;
    };
    store: {
      id: string;
      name: string;
    };
    orderItems: Array<{
      id: string;
      quantity: number;
      price: number;
      subtotal: number;
      productName?: string | null; // Denormalized product name (fallback if product is null)
      product: {
        id: string;
        name: string;
        barcode?: string;
      } | null; // Product can be null if deleted
    }>;
  }>;
}

export interface CustomerSummary {
  totalCustomers: number;
  retail: number;
  wholesale: number;
  corporate: number;
  vip: number;
  inactive: number;
  lifetimeRevenue: number;
}

export const customersService = {
  async getCustomers(params?: {
    limit?: number;
    lastKey?: string;
    customerType?: string;
    segmentId?: string;
    tags?: string; // comma-separated
    search?: string;
    storeId: string;
  }): Promise<CustomersResponse> {
    // Filter out undefined and empty string values
    const cleanParams: Record<string, string | number> = {};
    cleanParams.storeId = params!.storeId; // storeId is required
    if (params?.limit !== undefined) {
      cleanParams.limit = params.limit;
    }
    if (params?.lastKey) {
      cleanParams.lastKey = params.lastKey;
    }
    if (params?.customerType && params.customerType.trim() !== "") {
      cleanParams.customerType = params.customerType;
    }
    if (params?.segmentId && params.segmentId.trim() !== "") {
      cleanParams.segmentId = params.segmentId;
    }
    if (params?.tags && params.tags.trim() !== "") {
      cleanParams.tags = params.tags;
    }
    if (params?.search && params.search.trim() !== "") {
      cleanParams.search = params.search;
    }
    const response = await apiClient.get<CustomersResponse>(
      "/shopkeeper/customers",
      cleanParams
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get customers");
    }
    return response.data;
  },
  async createCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    customerType?: string;
    storeId: string;
  }): Promise<Customer> {
    const response = await apiClient.post<Customer>(
      "/shopkeeper/customers",
      data
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to create customer");
    }
    return response.data;
  },
  async getCustomerDetails(id: string): Promise<CustomerDetails> {
    const response = await apiClient.get<CustomerDetails>(
      `/shopkeeper/customers/${id}`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get customer details");
    }
    return response.data;
  },

  async updateCustomer(
    id: string,
    updates: {
      name?: string;
      email?: string;
      gstin?: string;
      billingAddress?: string;
      customerType?: string;
      tags?: string[];
    }
  ): Promise<Customer> {
    const response = await apiClient.put<Customer>(
      `/shopkeeper/customers/${id}`,
      updates
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to update customer");
    }
    return response.data;
  },
  async getSummary(storeId: string): Promise<CustomerSummary> {
    const response = await apiClient.get<CustomerSummary>(
      "/shopkeeper/customers/summary",
      { storeId }
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get customer summary");
    }
    return response.data;
  },
  /**
   * Export customers as CSV or JSON
   */
  async exportCustomers(
    format: "csv" | "json" = "csv",
    storeId: string
  ): Promise<void> {
    const blob = await apiClient.downloadFile("/shopkeeper/customers/export", {
      format,
      storeId,
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-export-${
      new Date().toISOString().split("T")[0]
    }.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  /**
   * Import customers from CSV or XLSX file
   */
  async importCustomers(
    file: File,
    storeId: string
  ): Promise<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; phone: string; error: string }>;
  }> {
    const response = await apiClient.uploadFile<{
      total: number;
      created: number;
      updated: number;
      skipped: number;
      errors: Array<{ row: number; phone: string; error: string }>;
    }>("/shopkeeper/customers/import", file, { storeId });
    if (!response.data) {
      throw new Error("Import failed: No data returned from server");
    }
    return response.data;
  },
};
