import { apiClient } from "@/lib/api";

export interface Product {
  id: string;
  productId?: string; // 8-digit product ID (auto-generated if not provided)
  name: string;
  barcode?: string;
  qrCode?: string;
  categoryId?: string;
  subcategoryId?: string;
  manufacturerId?: string;
  hsnCode?: string;
  taxPercentage?: number;
  mrp?: number;
  costPrice?: number;
  costPriceBase?: number;
  costGST?: number;
  sellingPrice?: number;
  sellingPriceBase?: number;
  sellingGST?: number;
  marginPercentage?: number;
  purchaseMarginPercentage?: number;
  supplierId?: string;
  brandId?: string;
  quantity: number;
  lowStockAlert?: number; // Threshold for low stock alert
  requireCustomBarcode: boolean;
  needsBarcode: boolean;
  barcodeGenerated: boolean;
  storeId?: string; // Store ID (direct property from backend)
  category?: { name: string };
  subcategory?: { name: string };
  manufacturer?: { name: string };
  brand?: { name: string };
  store?: { id: string; name: string }; // Store object (optional, may not be included in list view)
}

export interface InventoryResponse {
  data: Product[];
  pagination?: {
    limit: number;
    lastKey?: string | null;
    hasMore: boolean;
    totalCount?: number;
    currentPage?: number;
    itemsPerPage?: number;
  };
}

export const inventoryService = {
  async getInventory(params: {
    limit?: number;
    lastKey?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    storeId: string;
  }): Promise<InventoryResponse> {
    // Filter out undefined, null, and empty string values
    const cleanParams: Record<string, string | number> = {};
    if (params?.limit !== undefined) {
      cleanParams.limit = params.limit;
    }
    if (
      params?.lastKey &&
      params.lastKey !== "undefined" &&
      params.lastKey !== "null"
    ) {
      cleanParams.lastKey = params.lastKey;
    }
    if (params?.search && params.search.trim() !== "") {
      cleanParams.search = params.search;
    }
    if (params?.startDate && params.startDate.trim() !== "") {
      cleanParams.startDate = params.startDate;
    }
    if (params?.endDate && params.endDate.trim() !== "") {
      cleanParams.endDate = params.endDate;
    }
    if (params?.storeId && params.storeId.trim() !== "") {
      cleanParams.storeId = params.storeId;
    }
    const response = await apiClient.get<InventoryResponse>(
      "/shopkeeper/inventory",
      Object.keys(cleanParams).length > 0 ? cleanParams : undefined
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get inventory");
    }
    return response.data;
  },

  async createProduct(
    productData: Partial<Product> & { storeId: string }
  ): Promise<Product> {
    const response = await apiClient.post<Product>(
      "/shopkeeper/inventory",
      productData
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to create product");
    }
    return response.data;
  },

  /**
   * Updates a product.
   * @param id - The product ID to update
   * @param updates - The product fields to update (may include storeId)
   * @param storeId - The store ID where the product belongs (required by backend, can also be in updates)
   */
  async updateProduct(
    id: string,
    updates: Partial<Product> & { storeId?: string },
    storeId?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = { ...updates };
    // Ensure storeId is included (from parameter or updates object)
    if (storeId) {
      updateData.storeId = storeId;
    } else if (!updateData.storeId && updates.storeId) {
      updateData.storeId = updates.storeId;
    }
    await apiClient.put(`/shopkeeper/inventory/${id}`, updateData);
  },

  /**
   * Bulk updates products with pre-calculated values from preview.
   * @param config - The bulk update configuration with calculated updates
   * @returns Promise that resolves with the number of updated products
   */
  async bulkUpdateProducts(
    config: {
      categoryIds?: string[];
      updates: Array<{
        productId: string;
        updates: {
          mrp?: number;
          costPrice?: number;
          costPriceBase?: number;
          costGST?: number;
          sellingPrice?: number;
          sellingPriceBase?: number;
          sellingGST?: number;
          marginPercentage?: number;
          purchaseMarginPercentage?: number;
          taxPercentage?: number;
        };
      }>;
    },
    storeId: string
  ): Promise<{ updatedCount: number }> {
    const response = await apiClient.post<{ updatedCount: number }>(
      `/shopkeeper/inventory/bulk-update?storeId=${storeId}`,
      config
    );
    if (!response.data) {
      throw new Error("Failed to bulk update products");
    }
    return response.data;
  },

  /**
   * Deletes a single product.
   * @param id - The product ID to delete
   * @param storeId - The store ID where the product belongs
   */
  async deleteProduct(id: string, storeId: string): Promise<void> {
    await apiClient.delete(`/shopkeeper/inventory/${id}`, {
      storeId,
    });
  },

  /**
   * Deletes multiple products.
   * @param ids - Array of product IDs to delete
   * @param storeId - The store ID where the products belong
   */
  async deleteProducts(ids: string[], storeId: string): Promise<void> {
    await apiClient.post(`/shopkeeper/inventory/delete-multiple`, {
      ids,
      storeId,
    });
  },

  async uploadInventory(
    file: File,
    options?: {
      autoGenerateBarcode?: boolean;
      taxPercentage?: number;
      marginPercentage?: number;
      purchaseMarginPercentage?: number;
      categoryId?: string;
      subcategoryId?: string;
      brandId?: string;
      hsnCode?: string;
      costPriceBeforeGST?: boolean;
    }
  ): Promise<void> {
    const additionalData: Record<string, string | number | boolean> = {};
    if (options?.autoGenerateBarcode !== undefined) {
      additionalData.autoGenerateBarcode = options.autoGenerateBarcode;
    }
    if (options?.taxPercentage !== undefined) {
      additionalData.taxPercentage = options.taxPercentage;
      // Also send as gstPercentage for backward compatibility
      additionalData.gstPercentage = options.taxPercentage;
    }
    if (options?.marginPercentage !== undefined) {
      additionalData.marginPercentage = options.marginPercentage;
    }
    if (options?.purchaseMarginPercentage !== undefined) {
      additionalData.purchaseMarginPercentage =
        options.purchaseMarginPercentage;
    }
    if (options?.categoryId) {
      additionalData.categoryId = options.categoryId;
    }
    if (options?.subcategoryId) {
      additionalData.subcategoryId = options.subcategoryId;
    }
    if (options?.brandId) {
      additionalData.brandId = options.brandId;
    }
    if (options?.hsnCode) {
      additionalData.hsnCode = options.hsnCode;
    }
    if (options?.costPriceBeforeGST !== undefined) {
      additionalData.costPriceBeforeGST = options.costPriceBeforeGST;
    }
    await apiClient.uploadFile(
      "/shopkeeper/upload/inventory",
      file,
      Object.keys(additionalData).length > 0 ? additionalData : undefined
    );
  },

  async generateBarcodes(productIds: string[]): Promise<void> {
    await apiClient.post("/shopkeeper/inventory/barcode/generate", {
      productIds,
    });
  },

  async generateQRCodes(productIds: string[]): Promise<void> {
    await apiClient.post("/shopkeeper/inventory/qrcode/generate", {
      productIds,
    });
  },

  async mapBarcode(productId: string, barcode: string): Promise<void> {
    await apiClient.post("/shopkeeper/inventory/barcode/map", {
      productId,
      barcode,
    });
  },

  async mapQRCode(productId: string, qrCode: string): Promise<void> {
    await apiClient.post("/shopkeeper/inventory/qrcode/map", {
      productId,
      qrCode,
    });
  },

  /**
   * Downloads barcode PDF for the specified products.
   * @param productIds - Optional array of product IDs to generate barcodes for
   * @param quantity - Optional number of copies per barcode
   * @param rows - Optional number of rows per page
   * @param columns - Optional number of columns per page
   * @returns A Promise that resolves to a Blob containing the PDF
   */
  async downloadBarcodes(
    productIds?: string[],
    quantity?: number,
    rows?: number,
    columns?: number
  ): Promise<Blob> {
    const params: Record<string, string | number | string[]> = {};
    if (productIds && productIds.length > 0) {
      params.productIds = productIds;
    }
    if (quantity !== undefined) {
      params.quantity = quantity;
    }
    if (rows !== undefined) {
      params.rows = rows;
    }
    if (columns !== undefined) {
      params.columns = columns;
    }
    return apiClient.downloadFile("/shopkeeper/download/barcode", params, {
      Accept: "application/pdf",
    });
  },

  /**
   * Downloads QR code PDF for the specified products.
   * @param productIds - Optional array of product IDs to generate QR codes for
   * @param quantity - Optional number of copies per QR code
   * @param rows - Optional number of rows per page
   * @param columns - Optional number of columns per page
   * @returns A Promise that resolves to a Blob containing the PDF
   */
  async downloadQRCodes(
    productIds?: string[],
    quantity?: number,
    rows?: number,
    columns?: number
  ): Promise<Blob> {
    const params: Record<string, string | number | string[]> = {};
    if (productIds && productIds.length > 0) {
      params.productIds = productIds;
    }
    if (quantity !== undefined) {
      params.quantity = quantity;
    }
    if (rows !== undefined) {
      params.rows = rows;
    }
    if (columns !== undefined) {
      params.columns = columns;
    }
    return apiClient.downloadFile("/shopkeeper/download/qrcode", params, {
      Accept: "application/pdf",
    });
  },

  async getCategories(storeId: string): Promise<
    Array<{
      id: string;
      name: string;
      storeId: string;
      gstRate?: number;
      hsnCode?: string;
      marginPercentage?: number;
      purchaseMarginPercentage?: number;
      overheadChargesPercentage?: number;
      subcategories: Array<{ id: string; name: string }>;
    }>
  > {
    const params: Record<string, string> = { storeId };
    const response = await apiClient.get<
      Array<{
        id: string;
        name: string;
        storeId: string;
        gstRate?: number;
        hsnCode?: string;
        marginPercentage?: number;
        purchaseMarginPercentage?: number;
        overheadChargesPercentage?: number;
        subcategories: Array<{ id: string; name: string }>;
      }>
    >("/shopkeeper/inventory/categories", params);
    return response.data || [];
  },

  async getSubcategories(categoryId: string): Promise<
    Array<{
      id: string;
      name: string;
      categoryId: string;
    }>
  > {
    const response = await apiClient.get<
      Array<{
        id: string;
        name: string;
        categoryId: string;
      }>
    >(`/shopkeeper/inventory/categories/${categoryId}/subcategories`);
    return response.data || [];
  },

  async createCategory(data: {
    name: string;
    storeId: string;
    gstRate?: number;
    hsnCode?: string;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    overheadChargesPercentage?: number;
  }): Promise<{
    id: string;
    name: string;
    storeId: string;
    gstRate?: number;
    hsnCode?: string;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    overheadChargesPercentage?: number;
    subcategories: Array<{ id: string; name: string }>;
  }> {
    const response = await apiClient.post<{
      id: string;
      name: string;
      storeId: string;
      gstRate?: number;
      hsnCode?: string;
      marginPercentage?: number;
      purchaseMarginPercentage?: number;
      overheadChargesPercentage?: number;
      subcategories: Array<{ id: string; name: string }>;
    }>("/shopkeeper/inventory/categories", data);
    if (!response.data) {
      throw new Error("Failed to create category");
    }
    return response.data;
  },

  async createSubcategory(data: { name: string; categoryId: string }): Promise<{
    id: string;
    name: string;
    categoryId: string;
  }> {
    const response = await apiClient.post<{
      id: string;
      name: string;
      categoryId: string;
    }>("/shopkeeper/inventory/subcategories", data);
    if (!response.data) {
      throw new Error("Failed to create subcategory");
    }
    return response.data;
  },

  async getSuppliers(storeId: string): Promise<
    Array<{
      id: string;
      name: string;
      storeId: string;
    }>
  > {
    const params: Record<string, string> = { storeId };
    const response = await apiClient.get<
      Array<{
        id: string;
        name: string;
        storeId: string;
      }>
    >("/shopkeeper/inventory/suppliers", params);
    return response.data || [];
  },

  async createSupplier(data: { name: string; storeId: string }): Promise<{
    id: string;
    name: string;
    storeId: string;
  }> {
    const response = await apiClient.post<{
      id: string;
      name: string;
      storeId: string;
    }>("/shopkeeper/inventory/suppliers", data);
    if (!response.data) {
      throw new Error("Failed to create supplier");
    }
    return response.data;
  },

  async updateCategory(
    id: string,
    data: {
      name?: string;
      gstRate?: number;
      hsnCode?: string;
      marginPercentage?: number;
      purchaseMarginPercentage?: number;
      overheadChargesPercentage?: number;
    }
  ): Promise<{
    id: string;
    name: string;
    storeId: string;
    gstRate?: number;
    hsnCode?: string;
    marginPercentage?: number;
    purchaseMarginPercentage?: number;
    overheadChargesPercentage?: number;
    subcategories: Array<{ id: string; name: string }>;
  }> {
    const response = await apiClient.put<{
      id: string;
      name: string;
      storeId: string;
      gstRate?: number;
      hsnCode?: string;
      marginPercentage?: number;
      purchaseMarginPercentage?: number;
      overheadChargesPercentage?: number;
      subcategories: Array<{ id: string; name: string }>;
    }>(`/shopkeeper/inventory/categories/${id}`, data);
    if (!response.data) {
      throw new Error("Failed to update category");
    }
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/shopkeeper/inventory/categories/${id}`);
  },

  async getBrands(storeId: string): Promise<
    Array<{
      id: string;
      name: string;
      storeId: string;
    }>
  > {
    const params: Record<string, string> = { storeId };
    const response = await apiClient.get<
      Array<{
        id: string;
        name: string;
        storeId: string;
      }>
    >("/shopkeeper/inventory/brands", params);
    return response.data || [];
  },

  async createBrand(data: { name: string; storeId: string }): Promise<{
    id: string;
    name: string;
    storeId: string;
  }> {
    const response = await apiClient.post<{
      id: string;
      name: string;
      storeId: string;
    }>("/shopkeeper/inventory/brands", data);
    if (!response.data) {
      throw new Error("Failed to create brand");
    }
    return response.data;
  },

  async deleteBrand(id: string): Promise<void> {
    await apiClient.delete(`/shopkeeper/inventory/brands/${id}`);
  },

  async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/shopkeeper/inventory/suppliers/${id}`);
  },

  /**
   * Gets category-wise summary of products with aggregated totals.
   * @param params - Parameters for filtering (storeId required, startDate, endDate optional)
   * @returns Promise that resolves to an array of category summaries
   */
  async getCategoryWiseSummary(params: {
    storeId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<
    Array<{
      category: string;
      qty: number;
      buyIncl: number;
      buyBase: number;
      buyGST: number;
      sellIncl: number;
      sellBase: number;
      sellGST: number;
      profitIncl: number;
    }>
  > {
    const cleanParams: Record<string, string> = { storeId: params.storeId };
    if (params?.startDate && params.startDate.trim() !== "") {
      cleanParams.startDate = params.startDate;
    }
    if (params?.endDate && params.endDate.trim() !== "") {
      cleanParams.endDate = params.endDate;
    }
    const response = await apiClient.get<
      Array<{
        category: string;
        qty: number;
        buyIncl: number;
        buyBase: number;
        buyGST: number;
        sellIncl: number;
        sellBase: number;
        sellGST: number;
        profitIncl: number;
      }>
    >(
      "/shopkeeper/inventory/category-wise-summary",
      Object.keys(cleanParams).length > 0 ? cleanParams : undefined
    );
    return response.data || [];
  },

  /**
   * Gets a product by barcode. Uses API endpoint for barcode lookup.
   * @param barcode - The barcode to search for
   * @returns The product if found, null otherwise
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await apiClient.get<Product>(
        "/shopkeeper/inventory/barcode",
        { barcode }
      );
      return response.data || null;
    } catch (err) {
      console.error("Failed to get product by barcode:", err);
      return null;
    }
  },

  /**
   * Calculates prices from MRP and margins (backend calculation)
   */
  async calculatePricesFromMRP(data: {
    mrp: number;
    taxPercentage: number;
    purchaseMarginPercentage?: number;
    marginPercentage?: number;
  }): Promise<{
    costPrice: number;
    costPriceBase: number;
    costGST: number;
    sellingPrice: number;
    sellingPriceBase: number;
    sellingGST: number;
  }> {
    const response = await apiClient.post<{
      costPrice: number;
      costPriceBase: number;
      costGST: number;
      sellingPrice: number;
      sellingPriceBase: number;
      sellingGST: number;
    }>("/shopkeeper/inventory/calculate-prices", data);
    if (!response.data) {
      throw new Error(response.error || "Failed to calculate prices");
    }
    return response.data;
  },

  /**
   * Calculates derived fields when one field changes (backend calculation)
   */
  async calculateDerivedFields(data: {
    field: string;
    value: number;
    currentData: {
      mrp?: number;
      costPrice?: number;
      costPriceBase?: number;
      costGST?: number;
      sellingPrice?: number;
      sellingPriceBase?: number;
      sellingGST?: number;
      taxPercentage: number;
      purchaseMarginPercentage?: number;
      marginPercentage?: number;
    };
    editCostPriceAsBase?: boolean;
    editSellingPriceAsBase?: boolean;
  }): Promise<{
    costPrice?: number;
    costPriceBase?: number;
    costGST?: number;
    sellingPrice?: number;
    sellingPriceBase?: number;
    sellingGST?: number;
    purchaseMarginPercentage?: number;
    marginPercentage?: number;
  }> {
    const response = await apiClient.post<{
      costPrice?: number;
      costPriceBase?: number;
      costGST?: number;
      sellingPrice?: number;
      sellingPriceBase?: number;
      sellingGST?: number;
      purchaseMarginPercentage?: number;
      marginPercentage?: number;
    }>("/shopkeeper/inventory/calculate-derived-fields", data);
    if (!response.data) {
      throw new Error(response.error || "Failed to calculate derived fields");
    }
    return response.data;
  },

  /**
   * Suggests HSN codes based on tax percentage from existing products in store
   */
  async suggestHSNCodes(
    storeId: string,
    taxPercentage: number
  ): Promise<Array<{ hsnCode: string; count: number }>> {
    try {
      const response = await apiClient.get<{
        suggestions: string[];
        detailed?: Array<{ hsnCode: string; count: number }>;
      }>("/shopkeeper/inventory/hsn/suggest", {
        storeId,
        taxPercentage: taxPercentage.toString(),
      });
      // Return detailed suggestions if available, otherwise convert simple suggestions
      if (response.data?.detailed && response.data.detailed.length > 0) {
        return response.data.detailed;
      }
      // Fallback to simple suggestions array
      return (response.data?.suggestions || []).map((hsn) => ({
        hsnCode: hsn,
        count: 1,
      }));
    } catch (error) {
      console.error("Failed to get HSN suggestions:", error);
      return [];
    }
  },
};
