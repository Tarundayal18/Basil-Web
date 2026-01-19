import { apiClient } from "@/lib/api";

export interface TopProduct {
  rank: number;
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export interface TopProductsResponse {
  month: number;
  year: number;
  topProducts: TopProduct[];
}

export const topProductsService = {
  async getTopProducts(params?: {
    storeId: string;
    month?: number;
    year?: number;
  }): Promise<TopProductsResponse> {
    const response = await apiClient.get<TopProductsResponse>(
      "/shopkeeper/reports/top-products",
      params as any
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get top products");
    }
    return response.data;
  },
};

