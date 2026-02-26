# TransConnect Web Portal - Render Static Site Deployment

**Date**: January 29, 2026  
**Platform**: Render Static Site  
**Backend**: https://transconnect-app-testing.onrender.com ✅

---

## 🚀 Quick Deployment Steps

### Step 1: Create Static Site on Render

1. Go to **Render Dashboard**: https://dashboard.render.com/
2. Click **"New +" → Static Site**
3. **Connect Repository**:
   - Repository: `3bsolutionsltd/transconnect-app` (or your GitHub repo)
   - Branch: `staging`

### Step 2: Configure Build Settings

```yaml
Name: transconnect-web-staging
Branch: staging
Root Directory: transconnect-web

Build Command: npm install && npm run build
Publish Directory: .next
```

**Important**: For Next.js static export, you may need to:
- Use `.next` as publish directory (server mode)
- OR use `out` directory (static export mode)

### Step 3: Environment Variables

Add these in Render static site settings:

```bash
# Core Configuration
NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com
NEXT_PUBLIC_APP_URL=https://transconnect-web-staging.onrender.com
NEXT_PUBLIC_ENVIRONMENT=staging

# Features (Disabled for staging)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=false

# Optional (Leave empty for staging)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
NEXT_PUBLIC_GA_TRACKING_ID=
```

### Step 4: Deploy

1. Click **"Create Static Site"**
2. Wait 3-5 minutes for build
3. **Expected URL**: `https://transconnect-web-staging.onrender.com`

---

## ✅ Post-Deployment Verification

### Test 1: Homepage Loads
```bash
curl -I https://transconnect-web-staging.onrender.com
# Should return 200 OK
```

### Test 2: API Connection
1. Open browser: https://transconnect-web-staging.onrender.com
2. Open Developer Tools → Network tab
3. Search for routes
4. Verify requests to staging backend succeed

### Test 3: Stopover Search
**Search Form**:
- Origin: `Kampala`
- Destination: `Masaka`
- Date: Tomorrow

**Expected**: Route found with correct pricing ✅

---

## 🔧 Backend CORS Update

The backend CORS has been updated to include:
```typescript
"https://transconnect-web-staging.onrender.com"
```

After deploying the web portal, commit and push the backend change:

```bash
cd transconnect-backend
git add src/index.ts
git commit -m "Add web staging URL to CORS whitelist"
git push origin staging
```

Render will auto-deploy the backend in 2-3 minutes.

---

## 🐛 Troubleshooting

### Issue: Build Fails

**Error**: `npm ERR! Missing script: "build"`

**Solution**: Check package.json has build script:
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

### Issue: 404 on All Routes

**Error**: Routes other than homepage return 404

**Solution**: Add `render.yaml` to root of transconnect-web:
```yaml
services:
  - type: web
    name: transconnect-web-staging
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: .next
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

### Issue: Environment Variables Not Working

**Symptom**: API calls go to localhost

**Solution**: 
1. Verify env vars in Render dashboard
2. Redeploy after adding variables
3. Clear browser cache
4. Check browser console for actual API URL

### Issue: CORS Errors

**Symptom**: "blocked by CORS policy" in console

**Solution**:
1. Verify backend deployed with updated CORS
2. Check staging backend logs
3. Test directly: `curl https://transconnect-app-testing.onrender.com/api/health`

---

## 📊 Deployment Status

### Current Setup

| Component | Status | URL |
|-----------|--------|-----|
| **Backend** | ✅ Deployed | https://transconnect-app-testing.onrender.com |
| **Admin** | ✅ Deployed | https://transconnect-admin-staging.onrender.com |
| **Web Portal** | 🔄 Deploying | https://transconnect-web-staging.onrender.com |

### Next Steps

1. ✅ Backend CORS updated
2. 🔄 Deploy web portal on Render
3. ⏳ Test stopover search functionality
4. ⏳ Run comprehensive tests
5. ⏳ Share staging URL with team

---

## 🧪 Testing Checklist

After deployment, test these scenarios:

### Basic Functionality
- [ ] Homepage loads without errors
- [ ] Search form displays correctly
- [ ] Route search returns results
- [ ] Seat selection works
- [ ] Booking flow completes
- [ ] Payment integration (test mode)

### New Segment Features
- [ ] Stopover search (Kampala → Masaka)
- [ ] Weekend pricing applies (+20%)
- [ ] Segment prices calculated correctly
- [ ] Distance and duration display
- [ ] Multiple stopovers work

### Integration
- [ ] API calls succeed (check Network tab)
- [ ] CORS no errors
- [ ] QR code generation works
- [ ] Booking confirmation displays

---

## 💰 Cost

**Render Static Site**: **FREE** (Starter tier)
- Bandwidth: 100 GB/month
- Build minutes: 500 minutes/month
- Perfect for staging

**Total Monthly Cost**: $0 (static site) + $7 (database) + $7 (backend) = **$14/month**

---

## 🔗 Related Files

- Backend CORS: `transconnect-backend/src/index.ts` (line 93)
- Package config: `transconnect-web/package.json`
- Environment example: `transconnect-web/.env.example`

---

**Status**: Ready to deploy 🚀  
**Estimated Time**: 10-15 minutes  
**Auto-Deploy**: Yes (on git push to staging branch)
