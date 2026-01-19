import { apiClient } from "@/lib/api";

export interface ScannedBill {
  id: string;
  storeId: string;
  supplierName?: string;
  supplierGSTIN?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  totalAmount?: number;
  status: "PENDING" | "PROCESSED" | "DUPLICATE" | "FAILED" | "PARSED" | "PARSED_NEEDS_CONFIRMATION" | "OCR_FAILED";
  duplicateOf?: string;
  items: ScannedBillItem[];
  s3Key?: string;
  s3Url?: string;
  createdAt: string;
  processedAt?: string;
  // OCR quality metrics
  overallConfidence?: number;
  isHandwritten?: boolean;
  handwrittenRatio?: number;
  requiresOwnerConfirmation?: boolean;
  extractionMethod?: string;
}

export interface ScannedBillItem {
  name: string;
  quantity: number;
  price: number;
  hsnCode?: string;
  gstRate?: number;
  taxPercentage?: number;
  totalAmount?: number;
  productName?: string; // Alternative to 'name'
  confidence?: number; // OCR confidence score (0-1)
  extractionMethod?: string; // 'table', 'line', 'form', etc.
}

export interface ScannedBillProcessingResult {
  billId: string;
  itemsAdded: number;
  itemsSkipped: number;
  itemsUpdated: number;
  message: string;
}

export interface ScannedBillsResponse {
  bills: ScannedBill[];
  lastKey?: string | null;
  count: number;
}

export interface ScannedBillAnalytics {
  totalBills: number;
  totalAmount: number;
  processedBills: number;
  pendingBills: number;
  duplicateBills: number;
  failedBills: number;
  itemsAdded: number;
  itemsSkipped: number;
  billsBySupplier: Record<string, number>;
  billsByMonth: Record<string, number>;
}

export const scannedBillsService = {
  /**
   * Get presigned URL for uploading a bill
   */
  async getUploadUrl(filename: string, contentType: string): Promise<{
    uploadId: string;
    presignedUrl: string;
    key?: string;
  }> {
    const response = await apiClient.post<{
      uploadId: string;
      presignedUrl: string;
      key?: string;
    }>("/shopkeeper/bills/upload", {
      filename,
      contentType,
    });
    if (!response.data) {
      throw new Error(response.error || "Failed to get upload URL");
    }
    return response.data;
  },

  /**
   * Notify backend that upload is complete to trigger OCR processing
   */
  async notifyUploadComplete(uploadId: string, key: string): Promise<void> {
    await apiClient.post(`/shopkeeper/bills/upload/${uploadId}/notify`, {
      key,
    });
  },

  /**
   * Upload file to S3 using presigned URL
   */
  async uploadFileToS3(
    presignedUrl: string,
    file: File
  ): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  },

  /**
   * List scanned bills
   */
  async getScannedBills(params?: {
    storeId?: string;
    supplierName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    lastKey?: string;
  }): Promise<ScannedBillsResponse> {
    const response = await apiClient.get<ScannedBillsResponse>(
      "/shopkeeper/scanned-bills",
      params
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get scanned bills");
    }
    return response.data;
  },

  /**
   * Get a single scanned bill
   */
  async getScannedBill(billId: string): Promise<ScannedBill> {
    const response = await apiClient.get<ScannedBill>(
      `/shopkeeper/scanned-bills/${billId}`
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get scanned bill");
    }
    return response.data;
  },

  /**
   * Process a scanned bill (add items to inventory)
   */
  async processScannedBill(
    billId: string,
    options?: {
      addAllItems?: boolean;
      skipDuplicates?: boolean;
    }
  ): Promise<ScannedBillProcessingResult> {
    const response = await apiClient.post<ScannedBillProcessingResult>(
      `/shopkeeper/scanned-bills/${billId}/process`,
      options || {}
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to process scanned bill");
    }
    return response.data;
  },

  /**
   * Get scanned bills analytics
   */
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ScannedBillAnalytics> {
    const response = await apiClient.get<ScannedBillAnalytics>(
      "/shopkeeper/scanned-bills/analytics",
      params
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get scanned bills analytics");
    }
    return response.data;
  },

  /**
   * Get scanned bills metrics
   */
  async getMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const response = await apiClient.get(
      "/shopkeeper/scanned-bills/metrics",
      params
    );
    return response.data;
  },

  /**
   * Get supplier statistics
   */
  async getSupplierStatistics(supplierName: string): Promise<any> {
    const response = await apiClient.get(
      `/shopkeeper/scanned-bills/suppliers/${encodeURIComponent(supplierName)}/statistics`
    );
    return response.data;
  },
};

