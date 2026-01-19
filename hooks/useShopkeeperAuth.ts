/**
 * Shopkeeper Authentication Hook
 * Wrapper around useAuth providing shopkeeper-specific authentication methods
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

interface LoginCredentials {
  identifier: string; // email OR phone
  password: string;
}

interface LoginResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

export function useShopkeeperAuth() {
  const { loginWithPassword, isAuthenticated, user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | string | null>(null);

  /**
   * Login with identifier (email OR phone) and password
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResponse> => {
    setLoading(true);
    setError(null);

    try {
      await loginWithPassword(credentials.identifier, credentials.password);
      return { success: true };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [loginWithPassword]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    login,
    loading: loading || authLoading,
    error,
    clearError,
    isAuthenticated,
    user,
  };
}
