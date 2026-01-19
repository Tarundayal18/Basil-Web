import { apiClient } from "@/lib/api";

// ==================== Types ====================

export interface AutoMapProductRequest {
  productName: string;
  hsnCode?: string;
  gstRate?: number;
  vendorName?: string;
}

export interface AutoMapProductResponse {
  productId?: string;
  productName?: string;
  hsnCode?: string;
  gstRate?: number;
  confidence: number;
  suggestions?: Array<{
    productId: string;
    productName: string;
    matchScore: number;
  }>;
}

export interface VendorPatternRequest {
  vendorName: string;
  invoiceItems: Array<{
    productName: string;
    hsnCode?: string;
    gstRate?: number;
    price?: number;
  }>;
}

export interface InvoiceError {
  id?: string;
  type: "WRONG_HSN" | "NEGATIVE_STOCK" | "GST_MISMATCH" | "IGST_WRONG" | "HSN_GST_MISMATCH" | "DUPLICATE_INVOICE" | "PRICE_ANOMALY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title?: string;
  description?: string;
  message?: string;
  orderId?: string;
  productId?: string;
  invoiceId?: string;
  affectedEntity?: {
    type: "INVOICE" | "PRODUCT" | "GST_RETURN";
    id: string;
  };
  suggestedFix?: string;
  detectedAt?: string;
  confidence?: number;
  details?: Record<string, any>;
}

export interface ErrorSummary {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  recentErrors: InvoiceError[];
}

export interface NaturalLanguageSearchRequest {
  query: string;
  dateRange?: { start: string; end: string };
}

export interface NaturalLanguageSearchResponse {
  answer: string;
  data?: any;
  query: string;
  confidence: number;
  charts?: Array<{
    type: "bar" | "line" | "pie" | "table";
    title: string;
    data: any;
  }>;
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  reasoning?: string;
}

export interface BusinessHealthScore {
  overallScore: number;
  components: {
    salesGrowth: { score: number; value: number; trend: "UP" | "DOWN" | "STABLE"; status: "GOOD" | "WARNING" | "CRITICAL" };
    stockTurnover: { score: number; value: number; trend: "UP" | "DOWN" | "STABLE"; status: "GOOD" | "WARNING" | "CRITICAL" };
    taxCompliance: { score: number; value: number; trend: "UP" | "DOWN" | "STABLE"; status: "GOOD" | "WARNING" | "CRITICAL" };
    customerRepeatRate: { score: number; value: number; trend: "UP" | "DOWN" | "STABLE"; status: "GOOD" | "WARNING" | "CRITICAL" };
    paymentDelays: { score: number; value: number; trend: "UP" | "DOWN" | "STABLE"; status: "GOOD" | "WARNING" | "CRITICAL" };
  };
  insights: string[];
  recommendations: Array<{
    priority: "HIGH" | "MEDIUM" | "LOW";
    title: string;
    description: string;
    action: string;
  }>;
  period: "WEEK" | "MONTH" | "QUARTER" | "YEAR";
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  suggestedQuantity: number;
  confidence: number;
  reason: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  estimatedDaysUntilOutOfStock?: number;
}

export interface PricingAnalysis {
  totalProducts: number;
  productsWithLowMargin: number;
  productsWithHighMargin: number;
  averageMargin: number;
  marginLeakage: number;
  underpricedItems: Array<{
    productId: string;
    productName: string;
    currentPrice: number;
    suggestedPrice: number;
    marginIncrease: number;
  }>;
  vendorPriceChanges: Array<{
    vendorId: string;
    vendorName: string;
    productId: string;
    productName: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
  }>;
}

export interface PriceSuggestionRequest {
  productId: string;
  competitorPrices?: number[];
  marketTrend?: "UP" | "DOWN" | "STABLE";
  demandLevel?: "HIGH" | "MEDIUM" | "LOW";
}

export interface PriceSuggestion {
  productId: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercent: number;
  reason: string;
  confidence: number;
}

export interface VendorReliability {
  vendorId: string;
  vendorName: string;
  reliabilityScore: number;
  onTimeDeliveryRate: number;
  qualityScore: number;
  communicationScore: number;
  totalOrders: number;
  issues: string[];
  strengths: string[];
}

export interface CustomerLifetimeValue {
  customerId: string;
  customerName: string;
  clv: number;
  averageOrderValue: number;
  orderFrequency: number;
  lastOrderDate: string;
  totalOrders: number;
  totalRevenue: number;
  segment: "HIGH_VALUE" | "MEDIUM_VALUE" | "LOW_VALUE" | "AT_RISK";
}

export interface CustomerSegmentation {
  segments: Array<{
    name: string;
    count: number;
    averageClv: number;
    characteristics: string[];
  }>;
  totalCustomers: number;
}

export interface GSTQueryRequest {
  query: string;
  orderId?: string;
  productId?: string;
  dateRange?: { start: string; end: string };
}

export interface GSTQueryResponse {
  answer: string;
  confidence: number;
  references?: string[];
  actionable?: boolean;
}

export interface LearnFromCorrectionRequest {
  type: "OCR" | "HSN" | "GST" | "PRODUCT_NAME";
  original: string;
  corrected: string;
  context?: {
    vendorName?: string;
    productName?: string;
    invoiceId?: string;
    hsnCode?: string;
  };
}

// ==================== Service ====================

export const aiService = {
  /**
   * Auto-map product from invoice line item
   */
  async autoMapProduct(request: AutoMapProductRequest): Promise<AutoMapProductResponse> {
    const response = await apiClient.post<AutoMapProductResponse>(
      "/shopkeeper/ai/invoice/auto-map",
      request
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to auto-map product");
    }
    return response.data;
  },

  /**
   * Detect and learn vendor patterns
   */
  async detectVendorPatterns(request: VendorPatternRequest): Promise<any> {
    const response = await apiClient.post(
      "/shopkeeper/ai/invoice/vendor-patterns",
      request
    );
    return response.data;
  },

  /**
   * Get GST rate suggestion
   */
  async suggestGSTRate(hsnCode: string, vendorName?: string): Promise<{ hsnCode: string; suggestedRate: number }> {
    const params: any = { hsnCode };
    if (vendorName) params.vendorName = vendorName;
    const response = await apiClient.get<{ hsnCode: string; suggestedRate: number }>(
      "/shopkeeper/ai/gst/suggest",
      params
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get GST rate suggestion");
    }
    return response.data;
  },

  /**
   * Scan invoices for errors
   */
  async scanErrors(params?: { startDate?: string; endDate?: string }): Promise<{ errors: InvoiceError[]; count: number }> {
    const response = await apiClient.get<{ errors: any[]; count: number }>(
      "/shopkeeper/ai/errors/scan",
      params
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to scan errors");
    }
    // Map backend DetectedError format to frontend InvoiceError format
    const mappedErrors: InvoiceError[] = (response.data.errors || []).map((err: any) => ({
      id: err.id,
      type: err.type,
      severity: err.severity,
      title: err.title,
      description: err.description,
      message: err.description || err.title, // Fallback for compatibility
      orderId: err.affectedEntity?.type === "INVOICE" ? err.affectedEntity.id : undefined,
      productId: err.affectedEntity?.type === "PRODUCT" ? err.affectedEntity.id : undefined,
      invoiceId: err.affectedEntity?.type === "INVOICE" ? err.affectedEntity.id : undefined,
      affectedEntity: err.affectedEntity,
      suggestedFix: err.suggestedFix,
      detectedAt: err.detectedAt,
      confidence: err.confidence,
      details: err.details || {},
    }));
    return { errors: mappedErrors, count: response.data.count || mappedErrors.length };
  },

  /**
   * Get error summary
   */
  async getErrorSummary(params?: { startDate?: string; endDate?: string }): Promise<ErrorSummary> {
    const response = await apiClient.get<ErrorSummary>(
      "/shopkeeper/ai/errors/summary",
      params
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get error summary");
    }
    return response.data;
  },

  /**
   * Natural language search
   */
  async naturalLanguageSearch(request: NaturalLanguageSearchRequest): Promise<NaturalLanguageSearchResponse> {
    const response = await apiClient.post<NaturalLanguageSearchResponse>(
      "/shopkeeper/ai/search",
      request
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to perform natural language search");
    }
    return response.data;
  },

  /**
   * Get business health score
   */
  async getBusinessHealthScore(period: "WEEK" | "MONTH" | "QUARTER" | "YEAR" = "MONTH"): Promise<BusinessHealthScore> {
    const response = await apiClient.get<BusinessHealthScore>(
      "/shopkeeper/ai/health-score",
      { period }
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get business health score");
    }
    return response.data;
  },

  /**
   * Get reorder suggestions
   */
  async getReorderSuggestions(params?: {
    minConfidence?: number;
    includeLowStock?: boolean;
    maxSuggestions?: number;
  }): Promise<ReorderSuggestion[]> {
    const response = await apiClient.get<{
      suggestions: ReorderSuggestion[];
      totalEstimatedCost?: number;
      priorityOrder?: string[];
      generatedAt?: string;
    }>(
      "/shopkeeper/ai/reorder",
      params
    );
    // Backend returns an object with suggestions array, extract it
    return response.data?.suggestions || [];
  },

  /**
   * Analyze pricing
   */
  async analyzePricing(params?: {
    minMargin?: number;
    checkVendorPriceChanges?: boolean;
  }): Promise<PricingAnalysis> {
    const response = await apiClient.get<PricingAnalysis>(
      "/shopkeeper/ai/pricing/analyze",
      params
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to analyze pricing");
    }
    return response.data;
  },

  /**
   * Get price suggestion for a product
   */
  async suggestPrice(request: PriceSuggestionRequest): Promise<PriceSuggestion> {
    const response = await apiClient.post<PriceSuggestion>(
      "/shopkeeper/ai/pricing/suggest",
      request
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get price suggestion");
    }
    return response.data;
  },

  /**
   * Get vendor reliability score
   */
  async getVendorReliability(vendorId: string): Promise<VendorReliability> {
    const response = await apiClient.get<VendorReliability>(
      "/shopkeeper/ai/vendor/reliability",
      { vendorId }
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get vendor reliability");
    }
    return response.data;
  },

  /**
   * Get customer lifetime value
   */
  async getCustomerLifetimeValue(customerId: string): Promise<CustomerLifetimeValue> {
    const response = await apiClient.get<CustomerLifetimeValue>(
      "/shopkeeper/ai/customer/clv",
      { customerId }
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get customer lifetime value");
    }
    return response.data;
  },

  /**
   * Get customer segmentation
   */
  async getCustomerSegmentation(): Promise<CustomerSegmentation> {
    const response = await apiClient.get<CustomerSegmentation>(
      "/shopkeeper/ai/customer/segmentation"
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to get customer segmentation");
    }
    return response.data;
  },

  /**
   * Ask GST query
   */
  async askGSTQuery(request: GSTQueryRequest): Promise<GSTQueryResponse> {
    const response = await apiClient.post<GSTQueryResponse>(
      "/shopkeeper/ai/gst/query",
      request
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to process GST query");
    }
    return response.data;
  },

  /**
   * Learn from correction
   */
  async learnFromCorrection(request: LearnFromCorrectionRequest): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      "/shopkeeper/ai/learn/correction",
      request
    );
    if (!response.data) {
      throw new Error(response.error || "Failed to learn from correction");
    }
    return response.data;
  },
};

