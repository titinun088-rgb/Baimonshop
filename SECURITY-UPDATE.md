# 🔒 SECURITY UPDATE - API KEYS PROTECTION

## ⚠️ CRITICAL CHANGES

**API keys are no longer stored in client-side code!**

All sensitive API calls now go through backend proxies:

### Backend API Routes (Vercel Serverless Functions)

1. **`/api/slip2go-verify`** - Slip verification proxy
2. **`/api/slip2go-qrcode`** - QR code generation proxy
3. **`/api/peamsub-topup`** - Peamsub top-up order proxy
4. **`/api/peamsub-check-order`** - Peamsub order status proxy

### Client-Side Wrappers

- **`src/lib/slip2goClient.ts`** - Slip2Go client wrapper
- **`src/lib/peamsubClient.ts`** - Peamsub client wrapper

## 🚀 DEPLOYMENT STEPS

### 1. Remove Old Environment Variables (Client-Side)

Remove from `.env.local`:
```bash
VITE_PEAMSUB_API_KEY=xxx  # REMOVE THIS
VITE_SLIP2GO_SECRET_KEY=xxx  # REMOVE THIS
```

### 2. Add New Environment Variables (Vercel - Server-Side)

Go to: https://vercel.com/[your-project]/settings/environment-variables

Add the following **Server-Side** variables:
```
PEAMSUB_API_KEY=qgwvsh5rwvtevey8zdh4bj13
SLIP2GO_SECRET_KEY=48eneHJpZiVu2j6nutRTjJdDX61kbqdC9TbvrZLJed4=
SLIP2GO_API_URL=https://connect.slip2go.com
```

**Important**: These keys are now **ONLY** accessible by backend API routes!

### 3. Update Import Statements

Replace old imports:
```typescript
// OLD (INSECURE)
import { verifySlip } from './lib/slip2goUtils';
import { createTopupOrder } from './lib/peamsubUtils';
```

With new imports:
```typescript
// NEW (SECURE)
import { verifySlip } from './lib/slip2goClient';
import { createTopupOrder } from './lib/peamsubClient';
```

### 4. Deploy to Vercel

```bash
git add -A
git commit -m "security: move API keys to backend proxies"
git push
```

### 5. Verify Security

After deployment, check production bundle:
```bash
# API keys should NOT appear in production JavaScript
curl https://[your-domain]/_next/static/chunks/*.js | grep -i "peamsub\|slip2go"
```

## ✅ SECURITY BENEFITS

1. **API Keys Hidden**: Keys stored only on server-side (Vercel Environment Variables)
2. **No Client Exposure**: Keys never appear in JavaScript bundles
3. **CORS Protection**: Backend validates all requests
4. **Sanitized Responses**: Backend filters sensitive data before returning to client
5. **Rate Limiting Ready**: Can add rate limiting to backend proxies

## 🔍 HOW IT WORKS

### Before (INSECURE):
```
Client → Direct API Call (with exposed API key) → Peamsub/Slip2Go
```

### After (SECURE):
```
Client → Backend Proxy (no API key) → Backend validates → External API (with hidden key)
```

## 📝 MIGRATION CHECKLIST

- [x] Create backend API proxies (`/api/*.ts`)
- [x] Create client-side wrappers (`slip2goClient.ts`, `peamsubClient.ts`)
- [ ] Update all import statements in components/pages
- [ ] Remove `VITE_PEAMSUB_API_KEY` from `.env.local`
- [ ] Remove `VITE_SLIP2GO_SECRET_KEY` from `.env.local`
- [ ] Add `PEAMSUB_API_KEY` to Vercel Environment Variables
- [ ] Add `SLIP2GO_SECRET_KEY` to Vercel Environment Variables
- [ ] Deploy to Vercel
- [ ] Test all payment flows in production
- [ ] Verify API keys not in production bundle

## 🔑 API KEY ROTATION (RECOMMENDED)

After migration, rotate your API keys:

1. **Peamsub**: Generate new API key at https://bo.peamsub.com
2. **Slip2Go**: Generate new API key at https://connect.slip2go.com
3. Update Vercel Environment Variables with new keys
4. Redeploy

This ensures old keys (potentially exposed in git history) are invalidated.
