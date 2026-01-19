# Troubleshooting API Gateway Routing Issues

## Problem: Endpoints Still Going to Wrong API Gateway

If you're seeing errors like:
```
Unable to connect to the API server. Endpoint: /shopkeeper/crm/reports/peak-hours | Base URL: https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev
```

This means the endpoint is going to the **Core Stack** (`qzzjg3i8me`) instead of the **Analytics Stack** (`znbn5ri9f1`).

## Step 1: Verify Environment Variables Are Set

Check your `.env.development.local` file has these lines (no quotes, no spaces around `=`):

```bash
NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL=https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev
NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL=https://f8l11138vd.execute-api.ap-south-1.amazonaws.com/dev
NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL=https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev
```

**Common mistakes:**
- ❌ `NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL = https://...` (spaces around `=`)
- ❌ `NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL="https://..."` (quotes)
- ✅ `NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL=https://...` (correct)

## Step 2: RESTART Next.js Server

**CRITICAL:** Environment variables are only loaded when Next.js starts. You MUST restart:

1. Stop the server (Ctrl+C in terminal)
2. Start again: `npm run dev`

## Step 3: Check Browser Console

After restarting, open browser console (F12) and look for:

1. **Initial load logs:**
   ```
   🔧 NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL: https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev
   ```

2. **API request logs:**
   ```
   [API Routing] Endpoint: /api/v1/shopkeeper/crm/reports/peak-hours, Stack: shopkeeper-analytics, Base URL: https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev
   ```

3. **If you see errors:**
   ```
   [API Routing ERROR] Stack-specific URL not found for shopkeeper-analytics
   [API Routing ERROR] Environment variable NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL is not set or not loaded
   ```

## Step 4: Verify Environment Variables Are Loaded

Add this temporarily to `lib/api.ts` at the top (after imports):

```typescript
if (typeof window !== "undefined") {
  console.log("=== ENVIRONMENT VARIABLES CHECK ===");
  console.log("NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL:", process.env.NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL);
  console.log("NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL:", process.env.NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL);
  console.log("NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL:", process.env.NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL);
}
```

If these show `undefined`, the environment variables are not loaded.

## Step 5: Clear Browser Cache

Sometimes cached JavaScript can cause issues:

1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or clear browser cache completely

## Step 6: Check File Location

Make sure `.env.development.local` is in the **root** of the frontend project:
```
basil-frontend-jobcard-ind/
  ├── .env.development.local  ← HERE
  ├── lib/
  ├── components/
  └── ...
```

## Step 7: Verify No Typos

Check for typos in environment variable names:
- ✅ `NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL`
- ❌ `NEXT_PUBLIC_SHOPKEEPER_ANALYTIC_API_URL` (missing 'S')
- ❌ `NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_URL` (missing '_API')

## Still Not Working?

1. **Check Next.js version** - Older versions may have issues with env vars
2. **Check for multiple .env files** - Make sure you're editing the right one
3. **Check for syntax errors** - Make sure there are no broken lines in `.env.development.local`
4. **Try removing and re-adding** the environment variables
5. **Check terminal output** - Next.js should show env vars on startup (if configured)

## Quick Test

After restarting, open browser console and run:
```javascript
console.log(process.env.NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL)
```

If it shows `undefined`, the environment variable is not loaded. Restart the server.
