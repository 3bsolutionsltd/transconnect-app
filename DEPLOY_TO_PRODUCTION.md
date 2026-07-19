# 🚀 Deploy UAT Fixes to Production

**Status**: Code pushed to GitHub ✅  
**Date**: July 7, 2026  
**Fixes**: TC010, TC011, TC012, TC013

---

## ✅ What's Been Done

1. ✅ Code changes committed
2. ✅ Pushed to GitHub (main branch)
3. ⏳ Waiting for deployment to production servers

---

## 🌐 Deployment Methods

### **Option A: Automatic Deployment (Render)**

If your Render service is connected to GitHub with auto-deploy:

1. **Check Render Dashboard**
   - Go to: https://dashboard.render.com
   - Find service: `transconnect-backend`
   - Check **Events** tab for automatic deployment
   - Should see: "Deploy triggered by push to main"

2. **Monitor Deployment**
   - Wait 3-5 minutes for build to complete
   - Check logs for any errors
   - Verify "Live" status

3. **Repeat for Frontend**
   - Find service: `transconnect-web`
   - Check deployment status
   - Monitor build logs

---

### **Option B: Manual Deployment (Render)**

If auto-deploy is not enabled:

#### Backend Deployment
```
1. Go to https://dashboard.render.com
2. Select: transconnect-backend
3. Click: "Manual Deploy" → "Deploy latest commit"
4. Select branch: main
5. Wait for deployment to complete
```

#### Frontend Deployment
```
1. Select: transconnect-web
2. Click: "Manual Deploy" → "Deploy latest commit"
3. Select branch: main
4. Wait for build to complete
```

---

### **Option C: Railway Deployment**

If using Railway instead:

#### Backend
```
1. Go to https://railway.app
2. Select your project
3. Find: transconnect-backend service
4. Railway auto-deploys on push (check Deployments tab)
5. Or click "Deploy" to manually trigger
```

#### Frontend
```
1. Find: transconnect-web service
2. Check Deployments tab
3. Verify latest commit is deployed
```

---

## 🔍 Verify Deployment

After deployment completes, test each fix:

### Test TC010 - Expired Booking Cancellation
```
1. Go to: https://transconnect.app/bookings
2. Find expired booking (travel date in past)
3. Click "Cancel Booking"
4. Expected: ✅ Cancellation succeeds
5. Should NOT see: "Cannot cancel booking less than 2 hours before travel"
```

### Test TC011 - Download Ticket
```
1. Go to booking with cash payment
2. URL: https://transconnect.app/booking-success?booking=...
3. Click "Download QR" button
4. Expected: ✅ Download starts immediately (no unresponsive prompts)
```

### Test TC012 - Transfer Request
```
1. Go to: https://transconnect.app/bookings
2. Find a confirmed booking
3. Click "Request Transfer" link
4. Expected: ✅ Opens transfer form (NOT 404)
5. Form should load at: /transfers/request?bookingId=...
```

### Test TC013 - iOS QR Download
```
1. Open https://transconnect.app on iOS device
2. Go to any booking with QR code
3. Click "Download QR"
4. Expected: ✅ Opens QR in new tab with save instructions
5. Long-press image to save to device
```

---

## 📋 Quick Command Reference

### Check Deployment Status (PowerShell)
```powershell
# Check if backend is responding
Invoke-WebRequest -Uri "https://api.transconnect.app/api/health" -Method GET

# Check frontend
Invoke-WebRequest -Uri "https://transconnect.app" -Method HEAD
```

### View Render Logs
```bash
# Install Render CLI (optional)
npm install -g render-cli

# View logs
render logs transconnect-backend
render logs transconnect-web
```

---

## 🎯 Deployment Checklist

- [ ] Confirmed code pushed to GitHub main branch
- [ ] Backend deployed on Render/Railway
- [ ] Frontend deployed on Render/Railway/Vercel
- [ ] TC010 tested and passing
- [ ] TC011 tested and passing
- [ ] TC012 tested and passing
- [ ] TC013 tested on iOS device
- [ ] All UAT tests marked as PASSED

---

## 🚨 Troubleshooting

### Deployment Not Starting
- Check GitHub webhook in Render/Railway settings
- Verify auto-deploy is enabled
- Manually trigger deployment from dashboard

### Build Errors
- Check logs in Render/Railway dashboard
- Verify all environment variables are set
- Check for TypeScript compilation errors

### Frontend Not Updating
- Clear browser cache (Ctrl+F5)
- Check if old build is cached
- Verify correct API_URL in environment

### Backend Not Responding
- Check database connection
- Verify environment variables
- Review application logs
- Check if migrations ran successfully

---

## 📞 Next Steps

1. **Open Render/Railway Dashboard**
2. **Verify Deployment Status**
3. **Test Each UAT Case**
4. **Mark Tests as Passed**
5. **Celebrate! 🎉**

---

**Production URLs**:
- Frontend: https://transconnect.app
- Admin: https://admin.transconnect.app
- API: https://api.transconnect.app

**GitHub Repo**: https://github.com/3bsolutionsltd/transconnect-app
