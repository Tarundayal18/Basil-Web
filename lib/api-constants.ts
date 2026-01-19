/**
 * API Constants for Frontend
 * Re-export from backend or define frontend-specific constants
 */

// Base URLs from environment variables
export const API_BASE_URLS = {
  ADMIN: process.env.NEXT_PUBLIC_ADMIN_API_URL || '',
  SHOPKEEPER: process.env.NEXT_PUBLIC_SHOPKEEPER_API_URL || '',
  BILLING: process.env.NEXT_PUBLIC_BILLING_API_URL || '',
  JOBCARD: process.env.NEXT_PUBLIC_JOBCARD_API_URL || '',
} as const;

// API Version
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Stack-specific prefixes
export const API_PATHS = {
  ADMIN: `${API_PREFIX}/admin`,
  SHOPKEEPER: `${API_PREFIX}/shopkeeper`,
  BILLING: `${API_PREFIX}/billing`,
  JOBCARD: `${API_PREFIX}/jobcard`,
  PUBLIC: `${API_PREFIX}/public`,
} as const;

// Shopkeeper Endpoints
export const SHOPKEEPER_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_PATHS.SHOPKEEPER}/auth/login`,
    PASSWORD_LOGIN: `${API_PATHS.SHOPKEEPER}/auth/login/password`,
    REGISTER: `${API_PATHS.SHOPKEEPER}/auth/register`,
    VERIFY_EMAIL: `${API_PATHS.SHOPKEEPER}/auth/verify-email`,
    SEND_PHONE_OTP: `${API_PATHS.SHOPKEEPER}/auth/phone/send-otp`,
    VERIFY_PHONE: `${API_PATHS.SHOPKEEPER}/auth/phone/verify`,
    FORGOT_PASSWORD: `${API_PATHS.SHOPKEEPER}/auth/forgot-password`,
    RESET_PASSWORD: `${API_PATHS.SHOPKEEPER}/auth/reset-password`,
  },
  INVENTORY: {
    LIST: `${API_PATHS.SHOPKEEPER}/inventory`,
    CREATE: `${API_PATHS.SHOPKEEPER}/inventory`,
    GET: (id: string) => `${API_PATHS.SHOPKEEPER}/inventory/${id}`,
    UPDATE: (id: string) => `${API_PATHS.SHOPKEEPER}/inventory/${id}`,
    DELETE: (id: string) => `${API_PATHS.SHOPKEEPER}/inventory/${id}`,
  },
  ORDERS: {
    LIST: `${API_PATHS.SHOPKEEPER}/orders`,
    CREATE: `${API_PATHS.SHOPKEEPER}/orders`,
    GET: (id: string) => `${API_PATHS.SHOPKEEPER}/orders/${id}`,
  },
} as const;

// Admin Endpoints
export const ADMIN_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_PATHS.ADMIN}/auth/login`,
  },
  STORES: {
    LIST: `${API_PATHS.ADMIN}/stores`,
    CREATE: `${API_PATHS.ADMIN}/stores`,
    GET: (id: string) => `${API_PATHS.ADMIN}/stores/${id}`,
  },
} as const;

// Billing Endpoints
export const BILLING_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_PATHS.BILLING}/auth/login`,
  },
  ITEMS: {
    SEARCH: `${API_PATHS.BILLING}/items`,
    GET: (id: string) => `${API_PATHS.BILLING}/items/${id}`,
  },
  ORDERS: {
    LIST: `${API_PATHS.BILLING}/orders`,
    CREATE: `${API_PATHS.BILLING}/orders`,
    GET: (id: string) => `${API_PATHS.BILLING}/orders/${id}`,
  },
} as const;

// JobCard Endpoints
export const JOBCARD_ENDPOINTS = {
  LIST: `${API_PATHS.JOBCARD}`,
  CREATE: `${API_PATHS.JOBCARD}`,
  GET: (id: string) => `${API_PATHS.JOBCARD}/${id}`,
  UPDATE: (id: string) => `${API_PATHS.JOBCARD}/${id}`,
  DELETE: (id: string) => `${API_PATHS.JOBCARD}/${id}`,
  STATUS: (id: string) => `${API_PATHS.JOBCARD}/${id}/status`,
  ITEMS: (id: string) => `${API_PATHS.JOBCARD}/${id}/items`,
  APPROVE: (id: string) => `${API_PATHS.JOBCARD}/${id}/approve`,
  REJECT: (id: string) => `${API_PATHS.JOBCARD}/${id}/reject`,
  GENERATE_INVOICE: (id: string) => `${API_PATHS.JOBCARD}/${id}/invoice`,
} as const;

// Helper function to build full URL
export function buildApiUrl(baseUrl: string, endpoint: string, stage: string = 'dev'): string {
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBaseUrl}/${stage}${cleanEndpoint}`;
}
