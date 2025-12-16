# 🚀 QUICK FIX: Production Routes Not Showing

## Issue
- ❌ Production website shows "0 routes found"
- ❌ Backend database is empty - no routes seeded

## 3 Ways to Fix (Choose One)

### ✅ OPTION 1: Use Admin API (EASIEST - No Render Access Needed)

1. **Deploy the updated backend first:**
```powershell
cd c:\Users\DELL\mobility-app\transconnect-backend
git add .
git commit -m "Add admin route seeding endpoint"
git push
```

2. **Wait for Render deployment** (2-3 minutes)

3. **Login as admin:**
   - Go to: https://admin.transconnect.app
   - Email: `admin@transconnect.ug`
   - Password: `admin123`

4. **Call the seed endpoint:**
```powershell
# Get admin token first (after logging in)
$token = "YOUR_JWT_TOKEN_FROM_LOGIN"

# Seed the routes
Invoke-RestMethod -Uri "https://transconnect-app-44ie.onrender.com/api/admin/seed-routes" `
  -Method POST `
  -Headers @{ "Authorization" = "Bearer $token" } `
  -ContentType "application/json"
```

**OR use browser console after admin login:**
```javascript
fetch('https://transconnect-app-44ie.onrender.com/api/admin/seed-routes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

---

### ✅ OPTION 2: Render Shell (RECOMMENDED if you have Render access)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select **transconnect-backend** service
3. Click **Shell** tab (top right)
4. Run:
```bash
node scripts/seed-routes-production.js
```

---

### ✅ OPTION 3: Local Connection (Advanced)

1. Get DATABASE_URL from Render:
   - Dashboard → transconnect-backend → Environment
   - Copy `DATABASE_URL`

2. Run locally:
```powershell
cd c:\Users\DELL\mobility-app\transconnect-backend
$env:DATABASE_URL = "postgresql://YOUR_DB_URL_HERE"
node scripts/seed-routes-production.js
```

---

## What Gets Created

### 🏢 Operator
- Company: TransConnect Pilot Bus Company
- Email: operator@transconnect.ug
- Password: operator123

### 🚌 Buses (3)
- UAZ-001T - Toyota Coaster (45 seats)
- UAZ-002T - Isuzu NPR (50 seats)  
- UAZ-003T - Mercedes Sprinter (30 seats)

### 🛣️ Routes (17)

| Route | Price | Daily Trips |
|-------|-------|-------------|
| Kampala ↔ Jinja | UGX 15,000 | 4 trips |
| Kampala ↔ Mbarara | UGX 25,000 | 3 trips |
| Kampala ↔ Entebbe | UGX 10,000 | 6 trips |
| Kampala ↔ Gulu | UGX 35,000 | 2 trips |
| Kampala ↔ Fort Portal | UGX 30,000 | 2 trips |

---

## Verify It Works

### 1. Check API directly:
```powershell
Invoke-RestMethod https://transconnect-app-44ie.onrender.com/api/routes
```

Should return **17 routes** instead of empty array.

### 2. Test on website:
- Visit: https://transconnect.app
- Try searching: "Kampala" → "Jinja"
- Should see route results

### 3. Check admin panel:
- Visit: https://admin.transconnect.app
- Login with admin@transconnect.ug / admin123
- Go to Routes section - should see 17 routes

---

## Troubleshooting

**Q: API returns 401 Unauthorized**
- You need to be logged in as admin
- Token might be expired - login again

**Q: Still showing 0 routes after seeding**
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)
- Check API directly to confirm routes exist

**Q: Error: "Route already exists"**
- Routes are already seeded! ✅
- Just verify they're visible on the website

---

## Files Created
- ✅ `scripts/seed-routes-production.js` - CLI seed script
- ✅ `src/routes/admin-seed.ts` - Admin API endpoints
- ✅ `PRODUCTION_ROUTES_SEEDING_GUIDE.md` - Detailed guide
- ✅ This quick fix guide

---

## Next Steps After Fixing

1. ✅ Verify routes appear on transconnect.app
2. Test booking flow end-to-end
3. Verify QR code generation works
4. Test payment integration
5. Monitor for errors in Render logs

---

**Need help?** Check Render logs for any errors after running seed command.
