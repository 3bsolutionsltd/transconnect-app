# Mobile App JWT Token Refresh - Deployment Guide

**Date:** January 27, 2026  
**Priority:** HIGH  
**Status:** ✅ READY TO BUILD

---

## 🎯 Overview

Mobile app updates to support **30-day JWT token lifetime** with **automatic token refresh** on expiry. This prevents users from being logged out and fixes the 401 booking errors.

---

## ✅ Changes Implemented

### 1. API Service Updates (`src/services/api.ts`)

#### Added Token Refresh Endpoint
```typescript
authApi.refreshToken() // POST /auth/refresh
```

#### Automatic Token Refresh on 401 Errors
- **Intercepts 401 errors** with `TOKEN_EXPIRED` or `INVALID_TOKEN` codes
- **Automatically refreshes token** in the background
- **Retries failed request** with new token
- **Queues multiple requests** during refresh to avoid race conditions
- **Falls back to re-login** if refresh fails

#### Key Features
- ✅ Seamless background refresh
- ✅ No user interruption
- ✅ Handles concurrent requests
- ✅ Automatic retry logic

### 2. Auth Context Updates (`src/contexts/AuthContext.tsx`)

#### Store Token Expiry
- Saves `expiresAt` timestamp from login/register
- Saves `expiresIn` duration for reference
- Logs token expiry information

#### Enhanced Login/Register
```typescript
{
  user: {...},
  token: "jwt_token",
  expiresAt: "2026-02-26T10:00:00.000Z", // NEW
  expiresIn: "30d" // NEW
}
```

---

## 🚀 Deployment Steps

### Step 1: Verify Backend is Deployed

Check backend has the refresh endpoint:
```bash
curl https://transconnect-app-44ie.onrender.com/api/auth/refresh \
  -X POST \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: 200 OK or 401 if token invalid

### Step 2: Update App Version

Edit [app.json](app.json):
```json
{
  "expo": {
    "version": "1.0.7",
    "android": {
      "versionCode": 7
    },
    "ios": {
      "buildNumber": "1.0.7"
    }
  }
}
```

### Step 3: Test Locally

```bash
cd transconnect-mobile

# Install dependencies (if needed)
npm install

# Start development server
npx expo start

# Test on device
# - Login
# - Verify token stored
# - Make API calls
# - Token should auto-refresh on 401
```

### Step 4: Build for Production

#### Option A: EAS Build (Recommended)
```bash
# Android APK
eas build --platform android --profile production

# iOS (if configured)
eas build --platform ios --profile production
```

#### Option B: Local Build
```bash
# Android
npx expo run:android --variant release

# iOS
npx expo run:ios --configuration Release
```

### Step 5: Test Production Build

1. Install APK on test device
2. Login with real credentials
3. Wait 5-10 minutes
4. Try booking ticket
5. Verify no 401 errors
6. Check logs for refresh messages

### Step 6: Deploy to Stores

#### Google Play Store
1. Go to [Play Console](https://play.google.com/console)
2. Upload new APK/AAB
3. Update release notes:
   ```
   - Fixed login expiration issues
   - Improved session management
   - Enhanced booking reliability
   - Automatic token refresh
   ```
4. Submit for review

#### Apple App Store (if applicable)
1. Upload to App Store Connect
2. Update version and release notes
3. Submit for review

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Login works
- [ ] Token expiry stored
- [ ] API calls succeed
- [ ] 401 triggers auto-refresh
- [ ] Failed refresh triggers re-login
- [ ] Booking works after refresh
- [ ] Multiple concurrent requests handled
- [ ] Offline mode still works
- [ ] Demo mode unaffected

### Test Scenarios

#### Scenario 1: Fresh Login
```
1. Login with valid credentials
2. Check console logs for "Token expires at"
3. Verify expiresAt stored in AsyncStorage
```

#### Scenario 2: Token Auto-Refresh
```
1. Login
2. Wait for token to near expiry (or mock 401)
3. Make API call (e.g., load bookings)
4. Verify: 
   - Console shows "Attempting to refresh token"
   - Console shows "Token refreshed successfully"
   - Request succeeds
```

#### Scenario 3: Failed Refresh
```
1. Login
2. Clear backend session (or invalidate token)
3. Make API call
4. Verify:
   - Refresh fails
   - User logged out
   - Redirected to login screen
```

#### Scenario 4: Concurrent Requests
```
1. Login
2. Make multiple API calls simultaneously
3. Mock 401 response
4. Verify:
   - Only one refresh attempt
   - All requests queued
   - All retry after refresh
```

---

## 📊 Expected Results

### Before Update
```
❌ Users logged out after 7 days
❌ 401 errors on booking
❌ Manual re-login required
❌ Poor user experience
```

### After Update
```
✅ Users stay logged in 30 days
✅ Automatic token refresh
✅ No booking interruptions
✅ Seamless user experience
```

---

## 🔍 Monitoring & Logs

### Check for These Log Messages

**Successful Refresh:**
```
🔄 Attempting to refresh token...
✅ Token refreshed successfully
```

**Failed Refresh:**
```
🔄 Attempting to refresh token...
❌ Token refresh failed: <error>
```

**Login with Expiry:**
```
✅ Login successful
✅ Token expires at: 2026-02-26T10:00:00.000Z
✅ Token valid for: 30d
```

### Debug Issues

If token refresh fails:
1. Check backend `/auth/refresh` endpoint is deployed
2. Verify `JWT_EXPIRES_IN=30d` in Render environment
3. Check network connectivity
4. Verify token format in AsyncStorage
5. Check console logs for detailed errors

---

## 🔧 Troubleshooting

### Issue: "Token refresh failed"
**Solution:**
- Ensure backend has refresh endpoint deployed
- Check network connectivity
- Verify token is valid JWT format

### Issue: Still getting 401 errors
**Solution:**
- Clear app data and re-login
- Check backend logs for token validation errors
- Verify API_BASE_URL is correct

### Issue: Infinite refresh loop
**Solution:**
- Check refresh endpoint response format
- Verify new token is being stored
- Check authorization header is updated

### Issue: Users logged out immediately
**Solution:**
- Verify expiresAt is being stored
- Check token format from backend
- Ensure refresh endpoint returns new token

---

## 📱 Build Commands Reference

```bash
# Development
npx expo start                    # Start dev server
npx expo start --clear            # Clear cache and start

# Production Build
eas build -p android --profile production
eas build -p ios --profile production

# Local Build
npx expo run:android --variant release
npx expo run:ios --configuration Release

# Preview Build
eas build -p android --profile preview

# Check Build Status
eas build:list
```

---

## 📦 Files Modified

- ✅ `src/services/api.ts` - Token refresh logic
- ✅ `src/contexts/AuthContext.tsx` - Store token expiry
- ✅ `app.json` - Version bump (to be done)

---

## 🎯 Success Criteria

1. ✅ Users can login and stay logged in for 30 days
2. ✅ Token auto-refreshes before expiry
3. ✅ 401 errors trigger automatic refresh
4. ✅ Failed requests retry after refresh
5. ✅ No user-facing errors
6. ✅ Booking flow works seamlessly

---

## 📞 Support

### If Issues Occur

**Backend Team:**
- Verify `/api/auth/refresh` endpoint deployed
- Check Render environment variables
- Review production logs

**Mobile Team:**
- Test token refresh logic locally
- Check API interceptor behavior
- Verify AsyncStorage operations

**DevOps:**
- Monitor app crash rates
- Check API error rates
- Review user session metrics

---

## 📝 Release Notes Template

**Version 1.0.7 - Bug Fixes & Improvements**

✅ **Fixed:** Login session expiration issues  
✅ **Improved:** Automatic session management  
✅ **Enhanced:** Booking reliability and stability  
✅ **Added:** Automatic token refresh for seamless experience  
✅ **Fixed:** 401 authentication errors

Users will now stay logged in longer and experience fewer interruptions when booking tickets.

---

## ⏭️ Next Steps After Deployment

1. **Monitor App Performance**
   - Check crash analytics
   - Review error logs
   - Track session duration

2. **Gather User Feedback**
   - Monitor app store reviews
   - Check support tickets
   - Survey user experience

3. **Optimize Further** (Future)
   - Add proactive refresh (7 days before expiry)
   - Implement refresh token rotation
   - Add biometric re-authentication

---

**Last Updated:** January 27, 2026  
**Author:** TransConnect Development Team  
**Version:** 1.0.0

---

**READY TO BUILD & DEPLOY** 🚀
