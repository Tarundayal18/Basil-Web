import { captureException, addBreadcrumb } from "./sentry";
import { getApiEndpoint, detectCountry } from "./region-config";
import { Country } from "./region-config";

// Legacy support: use NEXT_PUBLIC_API_URL if set, otherwise use region-aware routing
const LEGACY_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Log API URL for debugging (both dev and prod)
if (typeof window !== "undefined") {
  const detectedCountry = detectCountry();
  const apiEndpoint = getApiEndpoint(detectedCountry);
  console.log("🌐 Detected Country:", detectedCountry);
  console.log("🌐 API Base URL:", apiEndpoint);
  console.log("🔧 NEXT_PUBLIC_API_URL env var:", process.env.NEXT_PUBLIC_API_URL || "NOT SET");
  console.log("🔧 NEXT_PUBLIC_API_URL_INDIA:", process.env.NEXT_PUBLIC_API_URL_INDIA || "NOT SET");
  console.log("🔧 NEXT_PUBLIC_API_URL_NL:", process.env.NEXT_PUBLIC_API_URL_NL || "NOT SET");
  console.log("🔧 NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL:", process.env.NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL || "NOT SET");
  console.log("🔧 NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL:", process.env.NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL || "NOT SET");
  console.log("🔧 NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL:", process.env.NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL || "NOT SET");
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Error interface for error handling
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

class ApiClient {
  private baseUrl: string | null = null; // Will be set dynamically based on country
  private token: string | null = null;
  private useLegacyUrl: boolean = false;

  constructor(baseUrl?: string) {
    // If baseUrl is provided (legacy), use it
    if (baseUrl) {
      this.baseUrl = baseUrl;
      this.useLegacyUrl = true;
    } else {
      // Otherwise, use region-aware endpoint
      this.baseUrl = null; // Will be resolved dynamically
    }
    
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token");
    }
  }

  /**
   * Get the current API base URL (region-aware or legacy)
   * Now supports split stacks: admin, shopkeeper (core, inventory-billing, analytics), billing, jobcard
   */
  private getBaseUrl(endpoint?: string): string {
    if (this.useLegacyUrl && this.baseUrl) {
      return this.baseUrl;
    }
    
    // Determine which stack this endpoint belongs to
    const stack = this.detectStack(endpoint || '');
    
    // Get stack-specific base URL from environment
    const country = this.getCountry();
    const stackBaseUrl = this.getStackBaseUrl(stack, country);
    
    if (stackBaseUrl) {
      // Log for debugging (only in development)
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`[API Routing] Endpoint: ${endpoint}, Stack: ${stack}, Base URL: ${stackBaseUrl}`);
      }
      return stackBaseUrl;
    }
    
    // This should rarely happen now since we have hardcoded fallbacks
    // But log it if it does
    if (typeof window !== 'undefined' && stack && stack.startsWith('shopkeeper-')) {
      const envVarName = `NEXT_PUBLIC_${stack.toUpperCase().replace(/-/g, '_')}_API_URL`;
      console.warn(`[API Routing] Stack-specific URL not found for ${stack}. Endpoint: ${endpoint}.`);
      console.warn(`[API Routing] This should not happen - using region-aware fallback.`);
    }
    
    // Fallback to region-aware endpoint (this will use core stack, causing errors)
    const fallbackUrl = getApiEndpoint();
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn(`[API Routing] Using fallback URL: ${fallbackUrl} (this may be incorrect for ${stack} stack)`);
    }
    return fallbackUrl;
  }
  
  /**
   * Detect which stack an endpoint belongs to
   * For shopkeeper, we need to detect which of the 3 stacks (core, inventory-billing, analytics)
   */
  private detectStack(endpoint: string): 'admin' | 'shopkeeper' | 'shopkeeper-core' | 'shopkeeper-inventory-billing' | 'shopkeeper-analytics' | 'billing' | 'jobcard' | null {
    const normalized = endpoint.toLowerCase();
    
    if (normalized.includes('/admin/') || normalized.startsWith('/admin')) {
      return 'admin';
    }
    // Check for jobcards (plural) or jobcard (singular)
    if (normalized.includes('/jobcards') || normalized.includes('/jobcard') || normalized.startsWith('/jobcards') || normalized.startsWith('/jobcard')) {
      return 'jobcard';
    }
    
    // Check for standalone billing (not shopkeeper/billing)
    if ((normalized.includes('/billing/') || normalized.startsWith('/billing')) && !normalized.includes('/shopkeeper/billing')) {
      return 'billing';
    }
    
    // Shopkeeper endpoints - need to detect which stack
    if (normalized.includes('/shopkeeper/') || normalized.startsWith('/shopkeeper')) {
      // Analytics stack endpoints (check these first, as they're more specific)
      if (normalized.includes('/shopkeeper/ai/') || 
          normalized.includes('/shopkeeper/ai') ||
          normalized.includes('/shopkeeper/crm/') ||
          normalized.includes('/shopkeeper/crm') ||
          normalized.includes('/shopkeeper/customers') ||
          normalized.includes('/shopkeeper/reports/') ||
          normalized.includes('/shopkeeper/reports') ||
          // Downloads & uploads live in the analytics stack (see ShopkeeperDownloadFunction / ShopkeeperUploadFunction)
          normalized.includes('/shopkeeper/download') ||
          normalized.includes('/shopkeeper/upload') ||
          normalized.includes('/shopkeeper/scanned-bills') ||
          normalized.includes('/shopkeeper/file-operations')) {
        return 'shopkeeper-analytics';
      }
      
      // Inventory & Billing stack endpoints
      if (normalized.includes('/shopkeeper/inventory') ||
          normalized.includes('/shopkeeper/products') ||
          normalized.includes('/shopkeeper/orders') ||
          normalized.includes('/shopkeeper/bills') ||
          normalized.includes('/shopkeeper/billing/') ||
          normalized.includes('/shopkeeper/billing') ||
          normalized.includes('/shopkeeper/quotes') ||
          normalized.includes('/shopkeeper/credit-notes') ||
          normalized.includes('/shopkeeper/invoice-sharing')) {
        return 'shopkeeper-inventory-billing';
      }
      
      // Core stack endpoints (auth, profile, tenant, subscriptions, settings)
      // Everything else goes to core
      return 'shopkeeper-core';
    }
    
    return null;
  }
  
  /**
   * Get stack-specific base URL from environment variables
   * Falls back to hardcoded URLs if env vars not available (for development)
   */
  private getStackBaseUrl(stack: 'admin' | 'shopkeeper' | 'shopkeeper-core' | 'shopkeeper-inventory-billing' | 'shopkeeper-analytics' | 'billing' | 'jobcard' | null, country: Country): string | null {
    if (!stack) return null;
    
    // For India, use split stack URLs
    if (country === 'IN') {
      // Handle shopkeeper sub-stacks
      let envVar: string;
      let fallbackUrl: string | null = null;

      switch (stack) {
        case 'shopkeeper-core':
          envVar = 'NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL';
          fallbackUrl = 'https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        case 'admin':
          envVar = 'NEXT_PUBLIC_ADMIN_API_URL';
          // NOTE: keep this aligned with the deployed `basil-erp-ind-admin-dev` stack output `ApiBaseUrl`
          fallbackUrl = 'https://h7at6cg7gg.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        case 'shopkeeper-inventory-billing':
          envVar = 'NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL';
          fallbackUrl = 'https://f8l11138vd.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        case 'shopkeeper-analytics':
          envVar = 'NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL';
          fallbackUrl = 'https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        case 'shopkeeper':
          // Legacy: fallback to main shopkeeper URL
          envVar = 'NEXT_PUBLIC_SHOPKEEPER_API_URL';
          fallbackUrl = 'https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        case 'jobcard':
          envVar = 'NEXT_PUBLIC_JOBCARD_API_URL';
          fallbackUrl = 'https://pwmr9ifkda.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        case 'billing':
          envVar = 'NEXT_PUBLIC_BILLING_API_URL';
          fallbackUrl = 'https://ti0zq6agtk.execute-api.ap-south-1.amazonaws.com/dev';
          break;
        default: {
          const _exhaustive: never = stack;
          envVar = 'NEXT_PUBLIC_SHOPKEEPER_API_URL';
          fallbackUrl = null;
          break;
        }
      }
      
      const baseUrl = process.env[envVar];
      
      // Debug logging in development
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`[API Routing] getStackBaseUrl - Stack: ${stack}, EnvVar: ${envVar}, Found: ${!!baseUrl}`, {
          baseUrl: baseUrl || 'NOT SET',
          fallbackUrl: fallbackUrl,
          allEnvVars: {
            CORE: process.env.NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL,
            ANALYTICS: process.env.NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL,
            INVENTORY: process.env.NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL,
            LEGACY: process.env.NEXT_PUBLIC_SHOPKEEPER_API_URL
          }
        });
      }
      
      if (baseUrl) {
        return baseUrl;
      }
      
      // FALLBACK: Use hardcoded URLs if env vars not available (for development)
      // This ensures the app works even if env vars aren't loaded
      if (fallbackUrl) {
        // For shopkeeper split stacks
        if (stack.startsWith('shopkeeper-')) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn(`[API Routing] Environment variable ${envVar} not found. Using fallback URL: ${fallbackUrl}`);
            console.warn(`[API Routing] To fix: Add ${envVar} to .env.development.local and restart server.`);
          }
          return fallbackUrl;
        }

        // For admin stack
        if (stack === 'admin') {
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn(`[API Routing] Environment variable ${envVar} not found. Using fallback URL: ${fallbackUrl}`);
            console.warn(`[API Routing] To fix: Add ${envVar} to .env.development.local and restart server.`);
          }
          return fallbackUrl;
        }
        
        // For jobcard and billing stacks
        if (stack === 'jobcard' || stack === 'billing') {
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.warn(`[API Routing] Environment variable ${envVar} not found. Using fallback URL: ${fallbackUrl}`);
          }
          return fallbackUrl;
        }
      }
      
      // Legacy shopkeeper stack fallback
      if (stack === 'shopkeeper') {
        const legacyUrl = process.env['NEXT_PUBLIC_SHOPKEEPER_API_URL'] || fallbackUrl;
        if (legacyUrl) {
          return legacyUrl;
        }
      }
    }
    
    // For other countries, fallback to region-aware endpoint
    return null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }
    }
  }

  /**
   * Get the current token from memory or localStorage
   * Always checks localStorage to ensure we have the latest token
   */
  private getToken(): string | null {
    // Always check localStorage to get the latest token
    // This ensures we have the token even if it was set after apiClient initialization
    if (typeof window !== "undefined") {
      const tokenFromStorage = localStorage.getItem("token");
      if (tokenFromStorage) {
        this.token = tokenFromStorage;
        return tokenFromStorage;
      }
    }
    return this.token;
  }
  
  /**
   * Normalize endpoint to include /api/v1 prefix if missing
   */
  private normalizeEndpoint(endpoint: string): string {
    // If endpoint already starts with /api/v1, return as is
    if (endpoint.startsWith('/api/v1')) {
      return endpoint;
    }
    
    // If endpoint starts with /api, assume it's already correct
    if (endpoint.startsWith('/api/')) {
      return endpoint;
    }
    
    // Add /api/v1 prefix
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `/api/v1${cleanEndpoint}`;
  }

  /**
   * Get country from context (localStorage or detect)
   */
  private getCountry(): Country {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("basil_country") as Country | null;
      if (stored && (stored === "IN" || stored === "NL" || stored === "DE")) {
        return stored;
      }
    }
    return detectCountry();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<ApiResponse<T>> {
    // Ensure endpoint has /api/v1 prefix
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const baseUrl = this.getBaseUrl(normalizedEndpoint);
    const url = `${baseUrl}${normalizedEndpoint}`;
    
    // Store normalized endpoint for use in error handling
    const currentEndpoint = normalizedEndpoint;
    
    // Log the full URL in development for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const stack = this.detectStack(normalizedEndpoint);
      console.log(`[API Request] ${options.method || 'GET'} ${url}`, {
        endpoint: normalizedEndpoint,
        stack: stack,
        baseUrl: baseUrl
      });
    }
    
    // Get current country and add to headers
    const country = this.getCountry();
    
    const headers: Record<string, string> = {
      "X-Country": country, // Always send country header for backend routing
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Extract timeout from options
    const { timeout, ...fetchOptions } = options;

    // Only set Content-Type when we actually send a JSON body.
    // Setting it on GET triggers an unnecessary CORS preflight and can cause "Failed to fetch" in browsers
    // when intermediate/network layers block OPTIONS.
    const body = (fetchOptions as RequestInit).body;
    const hasBody = body !== undefined && body !== null;
    const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === "content-type");
    const isFormData =
      typeof FormData !== "undefined" &&
      typeof body === "object" &&
      body !== null &&
      body instanceof FormData;
    if (hasBody && !hasContentType && !isFormData) {
      headers["Content-Type"] = "application/json";
    }
    
    // Create AbortController for timeout if specified
    const abortController = timeout ? new AbortController() : null;
    const timeoutId = timeout
      ? setTimeout(() => {
          abortController?.abort();
        }, timeout)
      : null;

    try {
      let response: Response;
      try {
        response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: abortController?.signal,
        });
        
        // Clear timeout if request succeeded
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } catch (fetchError) {
        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Handle network errors (CORS, connection refused, timeout, etc.)
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName = fetchError instanceof Error ? fetchError.name : "Unknown";
        const errorType = fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError;
        
        // Check if it's a timeout/abort error
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          const baseUrl = this.getBaseUrl(endpoint);
          const userFriendlyMessage = 
            `Request timeout. The request took longer than ${timeout}ms to complete. ` +
            `Endpoint: ${endpoint} | ` +
            `Base URL: ${baseUrl}`;
          
          const timeoutError = new Error(userFriendlyMessage);
          (timeoutError as any).code = "ETIMEDOUT";
          (timeoutError as any).isTimeout = true;
          
          // Track timeout error in Sentry
          addBreadcrumb(`API timeout: ${endpoint}`, "api", "warning", {
            endpoint,
            timeout,
            baseUrl,
          });
          captureException(timeoutError, {
            endpoint,
            timeout,
            baseUrl,
            errorType: "timeout",
          });
          
          throw timeoutError;
        }
        
        // Use normalized endpoint for stack routing (important for split stacks)
        const baseUrl = this.getBaseUrl(currentEndpoint);
        // Log detailed error information
        console.error("Network error - Failed to fetch:", {
          url,
          baseUrl,
          endpoint,
          errorType,
          errorName,
          errorMessage,
        });
        
        // Track network error in Sentry
        addBreadcrumb(`API network error: ${endpoint}`, "api", "error", {
          endpoint,
          errorType,
          errorName,
          baseUrl,
        });
        
        // Provide a more helpful error message
        const userFriendlyMessage = 
          `Unable to connect to the API server. ` +
          `Endpoint: ${currentEndpoint} | ` +
          `Base URL: ${baseUrl} | ` +
          `Error: ${errorMessage}`;
        
        const networkError = new Error(userFriendlyMessage);
        captureException(networkError, {
          endpoint,
          baseUrl,
          errorType,
          errorName,
          errorMessage,
        });
        
        throw networkError;
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      const isJson = contentType?.includes("application/json");

      if (!isJson) {
        // If not JSON, read as text for error message
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `Request failed with status ${response.status}`);
        }
        throw new Error("Invalid response format");
      }

      const data = await response.json();

      if (!response.ok) {
        // Backend returns { success: false, message: "...", error?: "..." }
        let errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
        
        // Industry-standard error handling: NEVER log out users unless it's a definitive token issue
        // Once authenticated via Google Sign-In, users should remain logged in
        // Only handle actual authentication failures, not endpoint availability or permission errors
        
        if (response.status === 401 || response.status === 403) {
          const lowerMessage = errorMessage.toLowerCase();
          
          // Only handle login-specific errors (not API endpoint errors)
          if (lowerMessage.includes('invalid credentials') || 
              lowerMessage.includes('invalid password') || 
              lowerMessage.includes('authentication failed')) {
            // This is only relevant during login, not for API calls
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          }
          
          // CRITICAL: Only redirect on DEFINITIVE token signature/expiration errors
          // This means the JWT itself is invalid, not just that an endpoint requires auth
          // We check for specific error messages that indicate token problems
          const isDefinitiveTokenError = 
            lowerMessage.includes('invalid token: invalid signature') ||
            (lowerMessage.includes('invalid token') && lowerMessage.includes('signature')) ||
            lowerMessage.includes('token verification failed') ||
            (lowerMessage.includes('token has expired') && !lowerMessage.includes('endpoint')) ||
            lowerMessage.includes('jwt expired') ||
            lowerMessage.includes('jwt malformed') ||
            lowerMessage.includes('invalid signature');
          
          // NEVER redirect on:
          // - Generic 401/403 (could be endpoint not found, permission denied, etc.)
          // - "Unauthorized" without token-specific context
          // - Endpoint availability checks
          // - Feature flag checks
          
          if (isDefinitiveTokenError) {
            // Only clear token and redirect if:
            // 1. It's a definitive token error (signature/expiration)
            // 2. We're not on a public page
            // 3. We're not checking feature flags or endpoint availability
            const isPublicPage = typeof window !== 'undefined' && 
              (window.location.pathname.includes('/login') || 
               window.location.pathname.includes('/register') ||
               window.location.pathname.includes('/onboarding'));
            
            const isEndpointCheck = typeof window !== 'undefined' &&
              (currentEndpoint.includes('/crm/') || 
               currentEndpoint.includes('/billing/') ||
               window.location.pathname.startsWith('/crm') ||
               window.location.pathname.startsWith('/billing'));
            
            // Only redirect if it's a real token problem and not an endpoint check
            if (typeof window !== 'undefined' && 
                !isPublicPage && 
                !isEndpointCheck) {
              console.error('Definitive token error detected, clearing session', { 
                endpoint: currentEndpoint, 
                pathname: window.location.pathname,
                error: errorMessage
              });
              this.setToken(null);
              window.location.href = '/login';
            } else {
              // For endpoint checks or public pages, just log and continue
              console.warn('Token error during endpoint check, not redirecting', { 
                endpoint: currentEndpoint,
                isPublicPage,
                isEndpointCheck
              });
            }
            errorMessage = 'Your session has expired. Please log in again.';
          } else {
            // Generic 401/403 - don't redirect, just show error
            // This could be:
            // - Endpoint doesn't exist (404-like behavior)
            // - Permission denied (user doesn't have access)
            // - Endpoint requires different auth
            // - Feature not available
            console.warn('API returned 401/403, but not a token error - treating as endpoint/permission issue', {
              endpoint: currentEndpoint,
              error: errorMessage,
              status: response.status
            });
            // Don't change errorMessage - let the component handle it
          }
        }
        
        const apiError = new Error(errorMessage);
        // Add status code to error for better handling
        (apiError as any).status = response.status;
        // Only mark as auth error if it's a definitive token error, not generic 401/403
        // Reuse lowerMessage from above if it exists, otherwise create it
        const errorMessageLower = errorMessage.toLowerCase();
        const isDefinitiveAuthError = 
          (response.status === 401 || response.status === 403) &&
          (errorMessageLower.includes('invalid token: invalid signature') ||
           (errorMessageLower.includes('invalid token') && errorMessageLower.includes('signature')) ||
           errorMessageLower.includes('token verification failed') ||
           errorMessageLower.includes('token has expired') ||
           errorMessageLower.includes('jwt expired') ||
           errorMessageLower.includes('jwt malformed') ||
           errorMessageLower.includes('invalid signature') ||
           errorMessageLower.includes('authentication token required'));
        (apiError as any).isAuthError = isDefinitiveAuthError;
        
        // Track API errors in Sentry (non-2xx responses)
        // Don't track authentication errors (401/403) as they're expected user errors
        if (response.status !== 401 && response.status !== 403) {
          addBreadcrumb(`API error: ${endpoint}`, "api", "error", {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
          });
        }
        
        // Only capture 5xx errors in Sentry (server errors)
        // 4xx errors are client errors and don't need tracking
        if (response.status >= 500) {
          captureException(apiError, {
            endpoint,
            status: response.status,
            statusText: response.statusText,
            responseData: data,
          });
        }
        
        throw apiError;
      }

      // Backend returns { success: true, data: {...}, message: "..." }
      return data;
    } catch (error) {
      // All errors should already be Error instances from the try block
      // But handle edge cases just in case
      if (error instanceof Error) {
        // Re-throw the error (it's already been logged if it was a network error)
        throw error;
      }
      // Handle non-Error objects (shouldn't happen, but just in case)
      console.error("Unexpected error type:", {
        url,
        endpoint,
        error,
        errorType: typeof error,
        errorString: String(error),
      });
      throw new Error("An unexpected error occurred");
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: { timeout?: number; headers?: Record<string, string>; cache?: RequestCache }
  ): Promise<ApiResponse<T>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params)
            .filter(
              ([, value]) =>
                value !== undefined &&
                value !== null &&
                value !== "undefined" &&
                value !== "null"
            )
            .reduce((acc, [key, value]) => {
              acc[key] = String(value);
              return acc;
            }, {} as Record<string, string>)
        ).toString()
      : "";
    return this.request<T>(endpoint + queryString, {
      method: "GET",
      ...options,
    });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: { timeout?: number; headers?: Record<string, string> }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify(body),
        ...options,
      }
    );
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
    options?: { timeout?: number; headers?: Record<string, string>; cache?: RequestCache }
  ): Promise<ApiResponse<T>> {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        ).toString()
      : "";
    return this.request<T>(endpoint + queryString, {
      method: "DELETE",
      ...options,
    });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // Ensure endpoint has /api/v1 prefix
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.getBaseUrl(normalizedEndpoint)}${normalizedEndpoint}`;
    
    // Get current country and add to headers (enterprise-grade: always send country)
    const country = this.getCountry();
    
    const headers: Record<string, string> = {
      "X-Country": country, // Include country header even for file uploads
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Note: Don't set Content-Type for FormData - browser will set it with boundary

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Upload failed");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Upload failed");
    }
  }

  /**
   * Downloads a file from the API endpoint.
   * @param endpoint - The API endpoint to download from
   * @param params - Optional query parameters
   * @param additionalHeaders - Optional additional headers to include in the request
   * @returns A Promise that resolves to a Blob
   */
  async downloadFile(
    endpoint: string,
    params?: Record<string, string | number | string[]>,
    additionalHeaders?: Record<string, string>
  ): Promise<Blob> {
    const queryString = params
      ? "?" +
        Object.entries(params)
          .map(([key, value]) => {
            if (Array.isArray(value)) {
              return value
                .map(
                  (v) =>
                    `${encodeURIComponent(key)}[]=${encodeURIComponent(
                      String(v)
                    )}`
                )
                .join("&");
            }
            return `${encodeURIComponent(key)}=${encodeURIComponent(
              String(value)
            )}`;
          })
          .join("&")
      : "";
    // Ensure endpoint has /api/v1 prefix
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    const url = `${this.getBaseUrl(normalizedEndpoint)}${normalizedEndpoint}${queryString}`;
    
    // Get current country and add to headers (enterprise-grade: always send country)
    const country = this.getCountry();
    
    const headers: Record<string, string> = {
      "X-Country": country, // Include country header for file downloads too
      ...(additionalHeaders || {}),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Download failed";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If not JSON, use the text or default message
        if (errorText) {
          errorMessage = errorText;
        }
      }
      throw new Error(errorMessage);
    }
    return response.blob();
  }
}

// Create API client instance (no baseUrl passed - will use region-aware routing)
export const apiClient = new ApiClient();

// Legacy support: export with explicit baseUrl if needed for backward compatibility
export const createLegacyApiClient = (baseUrl: string) => new ApiClient(baseUrl);
