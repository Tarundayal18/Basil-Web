# Environment Setup for India Frontend

## Quick Setup

Copy this to your `.env.local` file:

```env
# ============================================
# India - Split Stack URLs (REQUIRED)
# ============================================
NEXT_PUBLIC_ADMIN_API_URL=https://h7at6cg7gg.execute-api.ap-south-1.amazonaws.com/dev
NEXT_PUBLIC_SHOPKEEPER_API_URL=https://ebcnmlqfc0.execute-api.ap-south-1.amazonaws.com/dev
NEXT_PUBLIC_BILLING_API_URL=https://ti0zq6agtk.execute-api.ap-south-1.amazonaws.com/dev
NEXT_PUBLIC_JOBCARD_API_URL=https://pwmr9ifkda.execute-api.ap-south-1.amazonaws.com/dev

# ============================================
# Fallback (Optional - for backward compatibility)
# ============================================
NEXT_PUBLIC_API_URL_INDIA=https://ebcnmlqfc0.execute-api.ap-south-1.amazonaws.com/dev
```

## How It Works

1. **Stack Detection**: The API client automatically detects which stack to use based on the endpoint:
   - `/shopkeeper/*` → Uses `NEXT_PUBLIC_SHOPKEEPER_API_URL`
   - `/admin/*` → Uses `NEXT_PUBLIC_ADMIN_API_URL`
   - `/billing/*` → Uses `NEXT_PUBLIC_BILLING_API_URL`
   - `/jobcard/*` → Uses `NEXT_PUBLIC_JOBCARD_API_URL`

2. **Automatic Prefix**: All endpoints automatically get `/api/v1` prefix:
   - You write: `/shopkeeper/auth/login`
   - It becomes: `/api/v1/shopkeeper/auth/login`

3. **Full URL**: The final URL is:
   - Base URL: `https://ebcnmlqfc0.execute-api.ap-south-1.amazonaws.com/dev`
   - Endpoint: `/api/v1/shopkeeper/auth/login`
   - Full: `https://ebcnmlqfc0.execute-api.ap-south-1.amazonaws.com/dev/api/v1/shopkeeper/auth/login`

## Verification

After setting environment variables, check the browser console:

```
🌐 Detected Country: IN
🌐 API Base URL: https://ebcnmlqfc0.execute-api.ap-south-1.amazonaws.com/dev
```

## Testing

1. Start your dev server: `npm run dev`
2. Open browser DevTools → Network tab
3. Try logging in
4. Verify the request URL includes `/api/v1` prefix

Example request:
```
POST https://ebcnmlqfc0.execute-api.ap-south-1.amazonaws.com/dev/api/v1/shopkeeper/auth/login/password
```

## Troubleshooting

### Issue: "Failed to fetch"

**Check:**
1. Environment variables are set correctly
2. API Gateway URLs are correct (no trailing slashes)
3. CORS is enabled on API Gateway
4. Network connectivity

### Issue: Wrong Stack URL

**Check:**
1. Environment variable names are correct (case-sensitive)
2. Endpoint path matches stack (e.g., `/shopkeeper/*` for shopkeeper)

### Issue: 404 Not Found

**Check:**
1. Endpoint path is correct
2. `/api/v1` prefix is being added (check Network tab)
3. Base URL doesn't have trailing slash

---

**Note**: The API client automatically handles all routing and prefixing. You don't need to change any code!
