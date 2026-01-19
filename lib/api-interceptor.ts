/**
 * API Request/Response Interceptor
 * Enterprise-level interceptors for logging, error tracking, and monitoring
 */

import { apiClient } from './api';

/**
 * Request interceptor - called before every request
 */
export interface RequestInterceptor {
  (url: string, options: RequestInit): void | Promise<void>;
}

/**
 * Response interceptor - called after every response
 */
export interface ResponseInterceptor {
  (url: string, response: Response, data: any): void | Promise<void>;
}

/**
 * Error interceptor - called on errors
 */
export interface ErrorInterceptor {
  (url: string, error: any): void | Promise<void>;
}

class ApiInterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Execute request interceptors
   */
  async executeRequestInterceptors(url: string, options: RequestInit) {
    for (const interceptor of this.requestInterceptors) {
      await interceptor(url, options);
    }
  }

  /**
   * Execute response interceptors
   */
  async executeResponseInterceptors(url: string, response: Response, data: any) {
    for (const interceptor of this.responseInterceptors) {
      await interceptor(url, response, data);
    }
  }

  /**
   * Execute error interceptors
   */
  async executeErrorInterceptors(url: string, error: any) {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(url, error);
    }
  }
}

/**
 * Global interceptor manager
 */
export const apiInterceptorManager = new ApiInterceptorManager();

/**
 * Setup default interceptors
 */
export function setupDefaultInterceptors() {
  // Request logging interceptor
  apiInterceptorManager.addRequestInterceptor((url, options) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${options.method || 'GET'} ${url}`, {
        headers: options.headers,
        body: options.body,
      });
    }

    // Track API calls for monitoring
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('api_request', {
        url,
        method: options.method || 'GET',
      });
    }
  });

  // Response logging interceptor
  apiInterceptorManager.addResponseInterceptor((url, response, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.status} ${url}`, data);
    }

    // Track successful API calls
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('api_response', {
        url,
        status: response.status,
        success: data?.success || false,
      });
    }
  });

  // Error tracking interceptor
  apiInterceptorManager.addErrorInterceptor((url, error) => {
    console.error(`[API Error] ${url}`, error);

    // Track errors for monitoring
    if (typeof window !== 'undefined') {
      // Send to error tracking service (e.g., Sentry, LogRocket)
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          tags: { api_url: url },
        });
      }

      // Track in analytics
      if ((window as any).analytics) {
        (window as any).analytics.track('api_error', {
          url,
          error: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN',
        });
      }
    }
  });
}

/**
 * Initialize interceptors
 */
if (typeof window !== 'undefined') {
  setupDefaultInterceptors();
}
