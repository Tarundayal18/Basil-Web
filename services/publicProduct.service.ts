export interface PublicProduct {
  id: string;
  name: string;
  mrp?: number;
  sellingPrice?: number;
  category?: { name: string } | null;
  subcategory?: { name: string } | null;
  manufacturer?: { name: string } | null;
  store?: { id: string; name: string } | null;
}

export const publicProductService = {
  async getProduct(storeId: string, productId: string): Promise<PublicProduct> {
    // Public endpoint doesn't require authentication, so we'll make a direct fetch
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const response = await fetch(
      `${API_BASE_URL}/public/stores/${storeId}/products/${productId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error || error.message || "Failed to fetch product"
      );
    }

    const data = await response.json();
    return data.data as PublicProduct;
  },
};
