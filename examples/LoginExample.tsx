/**
 * Login Component Example
 * Enterprise-level example showing best practices
 */

'use client';

import React, { useState } from 'react';
import { useShopkeeperAuth } from '@/hooks/useShopkeeperAuth';
import { validateLoginCredentials } from '@/lib/api-validator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorAlert } from '@/components/ErrorAlert';
import { useRouter } from 'next/navigation';

export function LoginExample() {
  const router = useRouter();
  const { login, loading, error, clearError } = useShopkeeperAuth();
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);
    clearError();

    // Validate input
    const validation = validateLoginCredentials(formData.identifier, formData.password);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      const response = await login({
        identifier: formData.identifier.trim(),
        password: formData.password,
      });

      if (response.success) {
        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Login error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors when user types
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Error Display */}
          {(error || validationErrors.length > 0) && (
            <ErrorAlert
              error={error || validationErrors.join(', ')}
              onDismiss={() => {
                clearError();
                setValidationErrors([]);
              }}
            />
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email or phone
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                value={formData.identifier}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email or phone"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
