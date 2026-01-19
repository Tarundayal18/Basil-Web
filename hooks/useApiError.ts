/**
 * API Error Handling Hook
 * Centralized error handling for API calls
 */

import { useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

export interface ErrorState {
  error: ApiError | null;
  message: string | null;
  code: string | null;
}

export function useApiError() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: null,
    code: null,
  });

  /**
   * Handle API error
   */
  const handleError = useCallback((error: any) => {
    if (error.success === false) {
      // API error response
      setErrorState({
        error: error as ApiError,
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
      });
    } else if (error.name === 'AbortError') {
      // Timeout error
      setErrorState({
        error: null,
        message: 'Request timed out. Please try again.',
        code: 'TIMEOUT',
      });
    } else if (error.message) {
      // Network or other error
      setErrorState({
        error: null,
        message: error.message,
        code: 'NETWORK_ERROR',
      });
    } else {
      // Unknown error
      setErrorState({
        error: null,
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      });
    }
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      message: null,
      code: null,
    });
  }, []);

  /**
   * Get user-friendly error message
   */
  const getUserFriendlyMessage = useCallback((error: ApiError | null): string => {
    if (!error) return 'An error occurred';

    const errorMessages: Record<string, string> = {
      '401': 'Please log in to continue',
      '403': 'You do not have permission to perform this action',
      '404': 'The requested resource was not found',
      '409': 'This resource already exists',
      '500': 'Server error. Please try again later',
      '503': 'Service temporarily unavailable',
      'VALIDATION_ERROR': 'Please check your input and try again',
      'UNAUTHORIZED': 'Please log in to continue',
      'FORBIDDEN': 'You do not have permission',
      'NOT_FOUND': 'Resource not found',
      'TIMEOUT': 'Request timed out. Please try again.',
      'NETWORK_ERROR': 'Network error. Please check your connection.',
    };

    return errorMessages[error.code || ''] || error.message || 'An error occurred';
  }, []);

  return {
    error: errorState.error,
    message: errorState.message,
    code: errorState.code,
    handleError,
    clearError,
    getUserFriendlyMessage,
  };
}
