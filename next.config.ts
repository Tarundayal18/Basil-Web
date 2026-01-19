/**
 * Next.js Configuration
 * Supports multi-domain deployment:
 * - basil.ind.in → India (Mumbai region, GST)
 * - basilsoftware.eu → EU (Frankfurt region, VAT)
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Multi-domain support
  // Each domain can have its own configuration
  // Domain-based routing is handled in lib/region-config.ts
  
  // Image optimization
  images: {
    domains: [
      'basil.ind.in',
      'basilsoftware.eu',
      'basilsoftware.de',
      'www.basil.ind.in',
      'www.basilsoftware.eu',
      'www.basilsoftware.de',
      // Add S3/CDN domains here
      'basil-erp-ind.s3.ap-south-1.amazonaws.com',
      'basil-erp-eu.s3.eu-central-1.amazonaws.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables that should be available on client
  // Note: All NEXT_PUBLIC_* variables are automatically exposed, but we list them here for clarity
  env: {
    NEXT_PUBLIC_API_URL_INDIA: process.env.NEXT_PUBLIC_API_URL_INDIA,
    NEXT_PUBLIC_API_URL_NL: process.env.NEXT_PUBLIC_API_URL_NL,
    NEXT_PUBLIC_API_URL_DE: process.env.NEXT_PUBLIC_API_URL_DE,
    // Shopkeeper split stack URLs
    NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL: process.env.NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL,
    NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL: process.env.NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL,
    NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL: process.env.NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL,
    NEXT_PUBLIC_SHOPKEEPER_API_URL: process.env.NEXT_PUBLIC_SHOPKEEPER_API_URL,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects (if needed)
  async redirects() {
    return [
      // Redirect www to non-www (optional - depends on your preference)
      // {
      //   source: '/:path*',
      //   has: [
      //     {
      //       type: 'host',
      //       value: 'www.basil.ind.in',
      //     },
      //   ],
      //   destination: 'https://basil.ind.in/:path*',
      //   permanent: true,
      // },
      // {
      //   source: '/:path*',
      //   has: [
      //     {
      //       type: 'host',
      //       value: 'www.basilsoftware.eu',
      //     },
      //   ],
      //   destination: 'https://basilsoftware.eu/:path*',
      //   permanent: true,
      // },
    ];
  },

  // Rewrites (for API proxying if needed)
  async rewrites() {
    return [];
  },
};

export default nextConfig;
