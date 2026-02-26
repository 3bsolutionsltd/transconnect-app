# TransConnect Web Portal - Staging Deployment Guide

**Date**: January 29, 2026  
**Portal**: Passenger Booking Portal (transconnect-web)  
**Backend**: https://transconnect-app-testing.onrender.com ✅

---

## 🎯 Objective

Deploy the passenger web portal to a staging environment for testing the new route segment features before production deployment.

---

## 📋 Prerequisites

- ✅ Backend staging deployed: https://transconnect-app-testing.onrender.com
- ✅ Test data seeded with route segments
- 🔲 Vercel account (or Render static site)
- 🔲 GitHub repository access

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Fast & Free)

#### Step 1: Create Staging Project

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Click **"Add New..." → Project**
3. Import from GitHub:
   - Repository: `3bsolutionsltd/transconnect-app`
   - Root Directory: `transconnect-web`
   - Framework Preset: **Next.js**

4. Project Settings:
   - **Name**: `transconnect-web-staging`
   - **Branch**: `staging` (or `main` for now)

#### Step 2: Configure Environment Variables

Add these in Vercel project settings:

```bash
# Core Configuration
NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com
NEXT_PUBLIC_APP_URL=https://transconnect-web-staging.vercel.app
NEXT_PUBLIC_ENVIRONMENT=staging

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=false

# Optional (leave empty for staging)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
NEXT_PUBLIC_GA_TRACKING_ID=
```

#### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Expected URL: `https://transconnect-web-staging.vercel.app`

#### Step 4: Update Backend CORS

Add the new URL to backend CORS whitelist:

```typescript
// transconnect-backend/src/index.ts (line ~93)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001", 
  "https://transconnect.app",
  "https://www.transconnect.app",
  "https://admin.transconnect.app", 
  "https://operators.transconnect.app",
  "https://transconnect-admin-staging.onrender.com",
  "https://transconnect-web-staging.vercel.app"  // ← ADD THIS
];
```

Then commit and push to staging branch to trigger Render auto-deploy.

---

### Option 2: Render (Static Site)

#### Step 1: Create Static Site

1. Go to **Render Dashboard**: https://dashboard.render.com/
2. Click **"New +" → Static Site**
3. Connect Repository: `3bsolutionsltd/transconnect-app`

4. Configuration:
   - **Name**: `transconnect-web-staging`
   - **Branch**: `staging`
   - **Root Directory**: `transconnect-web`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `out` (or `.next` if using Next.js server)

#### Step 2: Environment Variables

Add in Render settings:

```bash
NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com
NEXT_PUBLIC_ENVIRONMENT=staging
```

#### Step 3: Deploy

- Auto-deploys on git push to `staging` branch
- Expected URL: `https://transconnect-web-staging.onrender.com`

#### Step 4: Update Backend CORS

Same as Vercel, add the Render URL to CORS whitelist.

---

## 🧪 Testing the Staging Portal

### Test 1: Basic Connectivity

1. Open staging URL in browser
2. Check browser console for errors
3. Verify API connection: Network tab should show requests to staging backend

### Test 2: Search with Stopovers

**Test the new segment search feature:**

1. **Homepage → Search Form**
   - Origin: `Kampala`
   - Destination: `Masaka` (stopover on Kampala → Mbarara route)
   - Date: Tomorrow

2. **Expected Results:**
   - ✅ Route found: Kampala → Mbarara (via Masaka)
   - ✅ Price: UGX 10,000 (or 12,000 if weekend)
   - ✅ Distance: 125 km
   - ✅ Duration: 90 minutes

3. **Try More Stopover Searches:**
   - Masaka → Mbarara (should find segment 2-3)
   - Mityana → Fort Portal (different route)
   - Kampala → Lyantonde (should find multi-segment journey)

### Test 3: Booking Flow

1. Select a route from search results
2. Choose departure time
3. Select seats
4. Fill passenger details
5. Proceed to payment (use test mode)
6. Verify booking confirmation
7. Check QR code generation

### Test 4: Weekend Pricing

1. Search for weekend dates (Saturday/Sunday)
2. Select Kampala → Masaka route
3. **Expected**: Price shows +20% weekend premium
   - Base: UGX 10,000 → Weekend: UGX 12,000

---

## 🔍 Validation Checklist

### Pre-Deployment
- [ ] Backend staging is running and accessible
- [ ] Test data seeded with route segments
- [ ] Environment variables configured
- [ ] CORS updated in backend

### Post-Deployment
- [ ] Web portal loads without errors
- [ ] API requests succeed (check Network tab)
- [ ] Stopover searches return results
- [ ] Route details display correctly
- [ ] Seat selection works
- [ ] Booking flow completes
- [ ] Weekend pricing applies correctly
- [ ] QR codes generate properly

### Integration Tests
- [ ] Search API returns segment-based routes
- [ ] Price calculation includes variations
- [ ] Booking API creates reservations
- [ ] Payment integration works (test mode)

---

## 🐛 Troubleshooting

### Issue: CORS Errors

**Symptoms**: Console shows "blocked by CORS policy"

**Solution**:
1. Verify staging URL is added to backend CORS whitelist
2. Check backend deployment logs
3. Ensure CORS includes credentials: true

### Issue: No Routes Found

**Symptoms**: Search returns empty results

**Solution**:
1. Check if test data is seeded: `npx tsx scripts/check-routes.ts`
2. Verify API URL in environment variables
3. Check backend logs for errors
4. Test API directly: `curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Masaka&date=2026-01-30"`

### Issue: 404 on API Requests

**Symptoms**: All API calls return 404

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check if URL includes `/api` path
3. Test backend health: `curl https://transconnect-app-testing.onrender.com/api/health`

### Issue: Environment Variables Not Working

**Symptoms**: Portal uses localhost URLs

**Solution**:
1. In Vercel: Redeploy after adding env vars
2. In Next.js: Variables must start with `NEXT_PUBLIC_`
3. Check browser console: `console.log(process.env.NEXT_PUBLIC_API_URL)`

---

## 📊 Staging vs Production

| Aspect | Staging | Production |
|--------|---------|------------|
| **URL** | transconnect-web-staging.vercel.app | transconnect.app |
| **Backend** | transconnect-app-testing.onrender.com | transconnect-app-44ie.onrender.com |
| **Data** | Test data (fake routes/users) | Real production data |
| **Payments** | Test mode (Flutterwave sandbox) | Live payments |
| **Analytics** | Disabled | Enabled |
| **Purpose** | Testing new features | Live bookings |

---

## 🚀 Deployment Commands

### Quick Deploy to Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to web folder
cd transconnect-web

# Deploy to staging
vercel --env NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com \
       --env NEXT_PUBLIC_ENVIRONMENT=staging \
       --env NEXT_PUBLIC_ENABLE_ANALYTICS=false

# Assign to project
vercel --prod --name transconnect-web-staging
```

### Local Testing Against Staging Backend

```bash
cd transconnect-web

# Create .env.local
echo "NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com" > .env.local
echo "NEXT_PUBLIC_ENVIRONMENT=staging" >> .env.local

# Run locally
npm run dev

# Open http://localhost:3000
```

---

## 📝 Next Steps After Deployment

1. **Share Staging URL** with team for testing
2. **Run comprehensive tests** using POST_DEPLOYMENT_TEST_PLAN.md
3. **Gather feedback** on new segment search features
4. **Fix any issues** found during testing
5. **Prepare for production** deployment once validated

---

## 🔗 Related Documentation

- [POST_DEPLOYMENT_TEST_PLAN.md](../transconnect-backend/POST_DEPLOYMENT_TEST_PLAN.md) - Comprehensive testing guide
- [ROUTE_SEGMENTS_IMPLEMENTATION.md](../transconnect-backend/ROUTE_SEGMENTS_IMPLEMENTATION.md) - Feature documentation
- [STAGING_ENVIRONMENT_SETUP.md](../STAGING_ENVIRONMENT_SETUP.md) - Full staging setup guide

---

**Status**: Ready to deploy 🚀  
**Estimated Time**: 15-20 minutes  
**Cost**: Free (Vercel hobby tier) or $7/month (Render static site)
