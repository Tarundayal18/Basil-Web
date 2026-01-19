# API Gateway Configuration for Split Shopkeeper Stacks

## Overview

The shopkeeper backend is split into 3 stacks, each with its own API Gateway:
1. **Core Stack** - Auth, Profile, Tenant, Subscriptions, Settings
2. **Inventory & Billing Stack** - Products, Inventory, Orders, Bills, Quotes, Credit Notes
3. **Analytics Stack** - CRM, Reports, AI, Customers, Scanned Bills

## Environment Variables

Add these to your `.env.development.local` and `.env.production.local` files:

```bash
# Shopkeeper Core Stack (Auth, Profile, Tenant, Subscriptions, Settings)
NEXT_PUBLIC_SHOPKEEPER_CORE_API_URL=https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev

# Shopkeeper Inventory & Billing Stack (Products, Inventory, Orders, Bills, Quotes, Credit Notes)
NEXT_PUBLIC_SHOPKEEPER_INVENTORY_BILLING_API_URL=https://f8l11138vd.execute-api.ap-south-1.amazonaws.com/dev

# Shopkeeper Analytics Stack (CRM, Reports, AI, Customers, Scanned Bills)
NEXT_PUBLIC_SHOPKEEPER_ANALYTICS_API_URL=https://znbn5ri9f1.execute-api.ap-south-1.amazonaws.com/dev

# Legacy fallback (points to Core Stack)
NEXT_PUBLIC_SHOPKEEPER_API_URL=https://qzzjg3i8me.execute-api.ap-south-1.amazonaws.com/dev
```

## Endpoint Routing

The frontend automatically routes endpoints to the correct API Gateway:

### Core Stack (`shopkeeper-core`)
- `/shopkeeper/auth/*` - Authentication
- `/shopkeeper/profile/*` - User profile
- `/shopkeeper/tenant/*` - Tenant management
- `/shopkeeper/subscriptions/*` - Subscriptions
- `/shopkeeper/settings/*` - Settings

### Inventory & Billing Stack (`shopkeeper-inventory-billing`)
- `/shopkeeper/inventory/*` - Inventory management
- `/shopkeeper/products/*` - Products
- `/shopkeeper/orders/*` - Orders
- `/shopkeeper/bills/*` - Bills
- `/shopkeeper/quotes/*` - Quotes
- `/shopkeeper/credit-notes/*` - Credit notes
- `/shopkeeper/invoice-sharing/*` - Invoice sharing

### Analytics Stack (`shopkeeper-analytics`)
- `/shopkeeper/ai/*` - AI features (health-score, reorder, errors, etc.)
- `/shopkeeper/crm/*` - CRM (campaigns, offers, segments, reports)
- `/shopkeeper/customers/*` - Customer management
- `/shopkeeper/reports/*` - Reports
- `/shopkeeper/scanned-bills/*` - Scanned bills
- `/shopkeeper/file-operations/*` - File operations

## Production URLs

For production, replace `/dev` with `/prod` in the URLs above.

## Verification

After updating the environment variables, restart your Next.js development server:

```bash
npm run dev
```

The frontend will automatically route requests to the correct API Gateway based on the endpoint path.
