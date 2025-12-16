# 🚨 PRODUCTION ROUTES SEEDING GUIDE

## Problem
Production database at transconnect.app has **0 routes** - causing empty search results.

## Solution Options

### Option 1: Seed via Render Shell (RECOMMENDED)
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select **transconnect-backend** service
3. Click **Shell** tab
4. Run:
```bash
node scripts/seed-routes-production.js
```

### Option 2: Seed via Local Connection
1. Get production DATABASE_URL from Render:
   - Go to Render Dashboard → transconnect-backend → Environment
   - Copy `DATABASE_URL` value

2. Set environment variable:
```powershell
# PowerShell
$env:DATABASE_URL = "postgres://transconnect_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/transconnect_db"
node scripts/seed-routes-production.js
```

```bash
# Linux/Mac
export DATABASE_URL="postgres://transconnect_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/transconnect_db"
node scripts/seed-routes-production.js
```

### Option 3: Deploy New Version with Seed
Add to `package.json` build script:
```json
"build": "npx prisma generate && tsc --project tsconfig.prod.json && npm run seed:prod",
"seed:prod": "node scripts/seed-routes-production.js"
```

Then redeploy to Render.

## What Gets Created

The seed script creates:

### 1. Operator Account
- **Email:** operator@transconnect.ug
- **Password:** operator123
- **Company:** TransConnect Pilot Bus Company
- **License:** TC-2025-001

### 2. Buses (3 vehicles)
- UAZ-001T - Toyota Coaster (45 seats)
- UAZ-002T - Isuzu NPR (50 seats)
- UAZ-003T - Mercedes Benz Sprinter (30 seats)

### 3. Routes (17 active routes)

#### Popular Routes:
- **Kampala ↔ Jinja** (UGX 15,000) - 2 daily trips each way
- **Kampala ↔ Mbarara** (UGX 25,000) - 2 daily trips each way
- **Kampala ↔ Entebbe** (UGX 10,000) - 3 daily trips each way
- **Kampala ↔ Gulu** (UGX 35,000) - 1 daily trip each way
- **Kampala ↔ Fort Portal** (UGX 30,000) - 1 daily trip each way

## Verification

After seeding, verify at:
- **Web:** https://transconnect.app (search for routes)
- **Admin:** https://admin.transconnect.app (login and view routes)
- **API:** https://transconnect-app-44ie.onrender.com/api/routes

Expected response:
```json
{
  "routes": [
    {
      "id": "kampala-jinja-0800",
      "origin": "Kampala",
      "destination": "Jinja",
      "price": 15000,
      "departureTime": "08:00"
    },
    ...
  ],
  "count": 17
}
```

## Quick Test API Call
```bash
curl https://transconnect-app-44ie.onrender.com/api/routes
```

Should return array with 17 routes instead of empty array.

## Files Created
- ✅ `scripts/seed-routes-production.js` - Comprehensive route seeder
- ✅ This guide

## Next Steps After Seeding
1. Test route search on transconnect.app
2. Verify seat selection works
3. Test booking flow with the new routes
4. Monitor for any issues

---

**Need Help?** 
- Check Render logs for any errors
- Verify DATABASE_URL is correctly set
- Ensure production database is accessible
