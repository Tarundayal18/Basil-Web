"use client";

/**
 * Global error boundary component.
 * This component is rendered outside the root layout, so it cannot use any context providers.
 * It must be a client component and cannot use any hooks that depend on context.
 * Using inline styles to avoid any CSS dependencies that might trigger context usage.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error - BASIL Dashboard</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '1rem',
                  marginTop: 0,
                }}
              >
                Something went wrong!
              </h1>
              <p
                style={{
                  color: '#4b5563',
                  marginBottom: '1.5rem',
                  marginTop: 0,
                }}
              >
                An unexpected error occurred. Please try again.
              </p>
              {error.digest && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#9ca3af',
                    marginBottom: '1rem',
                    marginTop: 0,
                  }}
                >
                  Error ID: {error.digest}
                </p>
              )}
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#4338ca';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#4f46e5';
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

