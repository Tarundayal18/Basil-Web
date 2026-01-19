import { apiClient } from "@/lib/api";

export interface DashboardStats {
  cashCollected: number;
  salesNetGST: number; // Only this excludes GST
  grossProfit: number;
  monthlySales: number; // Includes GST
  yearlySales: number; // Includes GST
  netGSTPayable: number;
  grossProfitMargin: number;
  monthlyProfit: number;
  yearlyProfit: number;
}

export interface DashboardResponse {
  data: DashboardStats;
  message: string;
}

export const dashboardService = {
  async getStats(storeId?: string): Promise<DashboardStats> {
    let response: Awaited<ReturnType<typeof apiClient.get<DashboardStats>>>;

    if (storeId) {
      // Preferred (after backend deploy): store-scoped path avoids query-param forwarding issues.
      // Backward compatible: fall back to legacy query-param route if API Gateway returns a
      // non-CORS default response (browser shows "Failed to fetch").
      try {
        response = await apiClient.get<DashboardStats>(
          `/shopkeeper/dashboard/stats/${encodeURIComponent(storeId)}`,
          undefined,
          { cache: "no-store" }
        );
      } catch (e) {
        response = await apiClient.get<DashboardStats>(
          "/shopkeeper/dashboard/stats",
          { storeId },
          { cache: "no-store" }
        );
      }
    } else {
      response = await apiClient.get<DashboardStats>(
        "/shopkeeper/dashboard/stats",
        undefined,
        { cache: "no-store" }
      );
    }
    if (!response.data) {
      throw new Error(response.error || "Failed to get dashboard stats");
    }
    return response.data;
  },
};
