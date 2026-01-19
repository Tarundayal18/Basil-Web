# Environment Variables Setup for Split Shopkeeper Stacks

## Critical: Required Environment Variables

The shopkeeper backend is split into 3 stacks, each with its own API Gateway. You **MUST** set these environment variables for the frontend to work correctly.

## Add to `.env.development.local`

```bash
# Shopkeeper Core Stack (Auth, Profile, Tenant, Subscriptions, Settings)
NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL=https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev

# Shopkeeper Inventory & Billing Stack (Products, Inventory, Orders, Bills, Quotes, Credit Notes)
NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL=https://f8l11138vd.execute-api.ap-south-1.amazonaws.com/dev

# Shopkeeper Analytics Stack (CRM, Reports, AI, Customers, Scanned Bills)
NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL=https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev

# Legacy fallback (points to Core Stack - only used if specific stack URL not set)
NEXT_PUBLIC_SHOPKEEPER_API_URL=https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev
```

## Add to `.env.production.local` (for production)

Replace `/dev` with `/prod` in all URLs above.

## Verification

After adding these variables:

1. **Restart your Next.js development server** (required for env vars to load):
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. **Check the browser console** - You should see logs like:
   ```
   [API Routing] Endpoint: /api/v1/shopkeeper/crm/reports/peak-hours, Stack: shopkeeper-analytics, Base URL: https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev
   ```

3. **If you see warnings** like:
   ```
   [API Routing] Stack-specific URL not found for shopkeeper-analytics. Please set environment variable: NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL
   ```
   This means the environment variable is not set. Check your `.env.development.local` file.

## Troubleshooting

### Error: "Unable to connect to the API server" with wrong Base URL

**Symptom:** Endpoints like `/shopkeeper/crm/*` or `/shopkeeper/reports/*` are going to the Core Stack API Gateway (`qzzjg3i8me`) instead of Analytics Stack (`znbn5ri9f1`).

**Solution:**
1. Verify environment variables are set correctly in `.env.development.local`
2. Restart the Next.js server (env vars only load on startup)
3. Check browser console for routing logs
4. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Endpoint Routing Reference

| Endpoint Pattern | Stack | API Gateway ID |
|-----------------|-------|----------------|
| `/shopkeeper/auth/*` | Core | `qzzjg3i8me` |
| `/shopkeeper/profile/*` | Core | `qzzjg3i8me` |
| `/shopkeeper/tenant/*` | Core | `qzzjg3i8me` |
| `/shopkeeper/subscriptions/*` | Core | `qzzjg3i8me` |
| `/shopkeeper/settings/*` | Core | `qzzjg3i8me` |
| `/shopkeeper/inventory/*` | Inventory & Billing | `f8l11138vd` |
| `/shopkeeper/products/*` | Inventory & Billing | `f8l11138vd` |
| `/shopkeeper/orders/*` | Inventory & Billing | `f8l11138vd` |
| `/shopkeeper/bills/*` | Inventory & Billing | `f8l11138vd` |
| `/shopkeeper/quotes/*` | Inventory & Billing | `f8l11138vd` |
| `/shopkeeper/credit-notes/*` | Inventory & Billing | `f8l11138vd` |
| `/shopkeeper/ai/*` | Analytics | `znbn5ri9f1` |
| `/shopkeeper/crm/*` | Analytics | `znbn5ri9f1` |
| `/shopkeeper/reports/*` | Analytics | `znbn5ri9f1` |
| `/shopkeeper/customers/*` | Analytics | `znbn5ri9f1` |
| `/shopkeeper/scanned-bills/*` | Analytics | `znbn5ri9f1` |
| `/shopkeeper/download/*` | Analytics | `znbn5ri9f1` |
| `/shopkeeper/upload/*` | Analytics | `znbn5ri9f1` |

## Important Notes

- **Environment variables are only loaded when the Next.js server starts.** You must restart after adding/changing them.
- **`.env.development.local` is gitignored** - each developer needs to set these locally.
- **Production deployments** need these set in your hosting platform's environment variable settings (Vercel, AWS, etc.).
