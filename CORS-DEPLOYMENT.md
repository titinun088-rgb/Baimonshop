# 🚀 CORS Fix Deployment Guide

## What Was Changed
✅ Updated 6 backend proxy files to accept requests from `https://baimonshop.com`

## Files Modified
- `api/peamsub.ts`
- `api/peamsub-topup.ts`
- `api/peamsub-check-order.ts`
- `api/slip2go-verify.ts`
- `api/slip2go-verify-slip.ts`
- `api/slip2go-qrcode.ts`

## Quick Deploy (5 minutes)

### Step 1: Verify Changes Locally
```bash
npm run dev
```
Visit `http://localhost:8081` and check browser console - no CORS errors should appear.

### Step 2: Deploy to Vercel
```bash
git add api/
git commit -m "fix: Add production domain to CORS allowlist for baimonshop.com"
git push
```

### Step 3: Check Vercel Deployment
1. Go to https://vercel.com/dashboard
2. Click your project
3. Wait for build to complete
4. Check "Function Logs" tab for any errors

### Step 4: Test Production
Visit `https://baimonshop.com` and verify:
- ✅ No CORS errors in browser console
- ✅ Game list loads
- ✅ User info displays
- ✅ All features work

## Environment Variables (Already Set)
No changes needed! Your Vercel project already has:
- `PEAMSUB_API_KEY`
- `SLIP2GO_SECRET_KEY`

## If Something Goes Wrong

### Check Logs
```bash
vercel logs --function=api/peamsub
```

### Common Issues
| Error | Solution |
|-------|----------|
| 403 Forbidden | Domain not in allowlist (already fixed) |
| 401 Unauthorized | API key missing in Vercel env vars |
| 500 Server Error | Check Vercel logs |

### Rollback (if needed)
```bash
git revert HEAD
git push
```

---

**Estimated Time:** 5 minutes  
**Difficulty:** Low  
**Risk:** Very Low (only CORS headers changed)
