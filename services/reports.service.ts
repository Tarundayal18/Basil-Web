import { apiClient } from "@/lib/api";

export interface ReportsData {
  todayCashCollected: number;
  todaySalesNetGST: number;
  todayGrossProfit: number;
  todayGrossProfitMargin: number;
  todayOutputGST: number;
  todayInputGST: number;
  todayNetGSTPayable: number;
  rangeCashCollected: number;
  rangeSalesNetGST: number;
  rangeGrossProfit: number;
  rangeGrossProfitMargin: number;
  rangeNetProfit: number;
  rangeNetProfitMargin: number;
  rangeOutputGST: number;
  rangeInputGST: number;
  rangeNetGSTPayable: number;
  rangeBillsCount: number;
  recentInvoices: Array<{
    invoiceNumber: string;
    date: string;
    customer: string;
    subtotalNet: number;
    gst: number;
    totalIncl: number;
    profitNet: number;
    pdfUrl?: string;
  }>;
  totalProducts: number;
  lowStockItems: number;
  inventoryCostValue: number;
  potentialMargin: number;
}

export const reportsService = {
  async getReports(params?: {
    fromDate?: string;
    toDate?: string;
    storeId?: string;
  }): Promise<ReportsData> {
    // Filter out undefined and empty string values
    const cleanParams: Record<string, string> = {};
    if (params?.fromDate && params.fromDate.trim() !== "") {
      cleanParams.fromDate = params.fromDate;
    }
    if (params?.toDate && params.toDate.trim() !== "") {
      cleanParams.toDate = params.toDate;
    }
    if (params?.storeId && params.storeId.trim() !== "") {
      cleanParams.storeId = params.storeId;
    }
    const storeId = params?.storeId?.trim();
    // For store-scoped requests, storeId is in path; keep only date params in query string.
    const { storeId: _ignore, ...query } = cleanParams;
    let response: Awaited<ReturnType<typeof apiClient.get<ReportsData>>>;

    if (storeId) {
      try {
        response = await apiClient.get<ReportsData>(
          `/shopkeeper/reports/store/${encodeURIComponent(storeId)}`,
          Object.keys(query).length > 0 ? query : undefined,
          { cache: "no-store" }
        );
      } catch (e) {
        // Fallback: legacy query-param API (before backend deploy)
        response = await apiClient.get<ReportsData>(
          "/shopkeeper/reports",
          { ...query, storeId },
          { cache: "no-store" }
        );
      }
    } else {
      response = await apiClient.get<ReportsData>(
        "/shopkeeper/reports",
        Object.keys(query).length > 0 ? query : undefined,
        { cache: "no-store" }
      );
    }
    if (!response.data) {
      throw new Error(response.error || "Failed to get reports");
    }
    return response.data;
  },

  async downloadDailyReport(
    date: string,
    format: "csv" | "pdf"
  ): Promise<Blob> {
    return apiClient.downloadFile("/shopkeeper/download/report/daily", {
      date,
      format,
    });
  },

  async downloadMonthlyReport(
    month: string,
    format: "csv" | "pdf"
  ): Promise<Blob> {
    return apiClient.downloadFile("/shopkeeper/download/report/monthly", {
      month,
      format,
    });
  },

  async downloadCAExport(fromDate?: string, toDate?: string): Promise<Blob> {
    // TODO: Implement CA export endpoint in backend
    // For now, this will throw an error if endpoint doesn't exist
    const params: Record<string, string> = { export: "ca" };
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return apiClient.downloadFile("/shopkeeper/reports/sales", params);
  },

  async lockMonth(
    month: string,
    storeId: string
  ): Promise<{
    lock: {
      id: string;
      month: string;
      lockedAt: string;
      lockedBy: string;
      shopkeeper: { id: string; name: string; email: string };
      store: { id: string; name: string };
    };
    message: string;
  }> {
    const response = await apiClient.post<{
      lock: {
        id: string;
        month: string;
        lockedAt: string;
        lockedBy: string;
        shopkeeper: { id: string; name: string; email: string };
        store: { id: string; name: string };
      };
      message: string;
    }>("/shopkeeper/reports/lock-month", {
      month,
      storeId,
    });
    if (!response.data) {
      throw new Error(response.error || "Failed to lock month");
    }
    return response.data;
  },

  async getLockedMonths(params?: {
    storeId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      month: string;
      lockedAt: string;
      lockedBy: string;
      shopkeeper: { id: string; name: string; email: string };
      store: { id: string; name: string };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const cleanParams: Record<string, string> = {};
    if (params?.storeId) cleanParams.storeId = params.storeId;
    if (params?.page) cleanParams.page = String(params.page);
    if (params?.limit) cleanParams.limit = String(params.limit);

    const response = await apiClient.get<{
      data: Array<{
        id: string;
        month: string;
        lockedAt: string;
        lockedBy: string;
        shopkeeper: { id: string; name: string; email: string };
        store: { id: string; name: string };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/shopkeeper/reports/locked-months", cleanParams);
    if (!response.data) {
      throw new Error(response.error || "Failed to get locked months");
    }
    return response.data;
  },

  async getAuditTrails(params?: {
    storeId?: string;
    month?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      month: string;
      type: string;
      summary: string;
      actor: string;
      createdAt: string;
      shopkeeper: { id: string; name: string; email: string };
      store: { id: string; name: string };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const cleanParams: Record<string, string> = {};
    if (params?.storeId) cleanParams.storeId = params.storeId;
    if (params?.month) cleanParams.month = params.month;
    if (params?.type) cleanParams.type = params.type;
    if (params?.page) cleanParams.page = String(params.page);
    if (params?.limit) cleanParams.limit = String(params.limit);

    const response = await apiClient.get<{
      data: Array<{
        id: string;
        month: string;
        type: string;
        summary: string;
        actor: string;
        createdAt: string;
        shopkeeper: { id: string; name: string; email: string };
        store: { id: string; name: string };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/shopkeeper/reports/audit-trails", cleanParams);
    if (!response.data) {
      throw new Error(response.error || "Failed to get audit trails");
    }
    return response.data;
  },
};
