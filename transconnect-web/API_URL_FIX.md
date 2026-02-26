# API Configuration Fix for Staging

## ⚠️ Issue Found

The web portal is calling `/api/api/auth/login` instead of `/api/auth/login`

**Root Cause**: The environment variable needs to include `/api` suffix because:
- Backend routes are mounted at `/api/*` (e.g., `/api/auth/login`)
- Frontend `api.ts` uses the base URL directly without adding `/api`

## ✅ Fix Applied

### 1. Updated render.yaml
```yaml
NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com/api
```

### 2. Update Render Dashboard Environment Variable

Go to **Render Dashboard** → **transconnect-web-staging** → **Environment**:

**Change this**:
```
NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com
```

**To this**:
```
NEXT_PUBLIC_API_URL=https://transconnect-app-testing.onrender.com/api
```

Then click **"Save Changes"** - Render will auto-redeploy.

## 🧪 Test After Redeploy

1. Clear browser cache
2. Go to https://staging.transconnect.app
3. Try login with:
   ```
   Email: john@example.com
   Password: password123
   ```

4. Check browser console - should see successful API calls to:
   ```
   https://transconnect-app-testing.onrender.com/api/auth/login
   ```

## 📝 Commit the Fix

```bash
cd transconnect-web
git add render.yaml
git commit -m "Fix API URL configuration - add /api suffix"
git push origin staging
```

---

**Status**: Ready to deploy  
**ETA**: 2-3 minutes after updating environment variable
