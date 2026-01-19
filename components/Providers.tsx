'use client';

/**
 * Client-side Providers Wrapper
 * Wraps all context providers and initializes client-side features
 */

import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from "@/contexts/AuthContext";
import { CountryProvider } from "@/contexts/CountryContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ApiErrorBoundary } from "@/components/ErrorBoundary";
import { setupDefaultInterceptors } from "@/lib/api-interceptor";
import { setupPerformanceMonitoring } from "@/lib/monitoring";

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize API interceptors and monitoring on client-side only
  useEffect(() => {
    setupDefaultInterceptors();
    setupPerformanceMonitoring();
  }, []);

  // Get Google Client ID from environment variables
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Wrap with GoogleOAuthProvider if client ID is available
  const content = (
    <I18nProvider>
      <AuthProvider>
        <StoreProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </StoreProvider>
      </AuthProvider>
    </I18nProvider>
  );

  return (
    <ApiErrorBoundary>
      <CountryProvider>
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {content}
          </GoogleOAuthProvider>
        ) : (
          content
        )}
      </CountryProvider>
    </ApiErrorBoundary>
  );
}
