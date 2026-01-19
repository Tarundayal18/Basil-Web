/**
 * API Monitoring and Analytics
 * Enterprise-level monitoring for API calls
 */

import { apiClient } from './api';

/**
 * Track API performance
 */
export interface ApiMetrics {
  url: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: number;
}

class ApiMonitor {
  private metrics: ApiMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  /**
   * Record API call metrics
   */
  recordMetric(metric: ApiMetrics) {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('api_call', {
        url: metric.url,
        method: metric.method,
        duration: metric.duration,
        status: metric.status,
        success: metric.success,
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats() {
    if (this.metrics.length === 0) {
      return {
        totalCalls: 0,
        averageDuration: 0,
        successRate: 0,
        errorRate: 0,
      };
    }

    const successful = this.metrics.filter(m => m.success);
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      totalCalls: this.metrics.length,
      averageDuration: totalDuration / this.metrics.length,
      successRate: (successful.length / this.metrics.length) * 100,
      errorRate: ((this.metrics.length - successful.length) / this.metrics.length) * 100,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): ApiMetrics[] {
    return this.metrics
      .filter(m => !m.success)
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
  }
}

/**
 * Global API monitor
 */
export const apiMonitor = new ApiMonitor();

/**
 * Setup performance monitoring
 */
export function setupPerformanceMonitoring() {
  // Intercept fetch calls to measure performance
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const startTime = performance.now();
      // Handle string, Request, or URL types
      let url: string;
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof Request) {
        url = args[0].url;
      } else if (args[0] instanceof URL) {
        url = args[0].toString();
      } else {
        url = String(args[0]);
      }
      const method = (args[1]?.method || 'GET').toUpperCase();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        apiMonitor.recordMetric({
          url,
          method,
          duration,
          status: response.status,
          success: response.ok,
          timestamp: Date.now(),
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        apiMonitor.recordMetric({
          url,
          method,
          duration,
          status: 0,
          success: false,
          timestamp: Date.now(),
        });

        throw error;
      }
    };
  }
}

/**
 * Initialize monitoring
 */
if (typeof window !== 'undefined') {
  setupPerformanceMonitoring();
}
