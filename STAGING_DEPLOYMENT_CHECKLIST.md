# Staging Environment Deployment Checklist

**Date**: January 28, 2026  
**Deployer**: _______________  
**Estimated Time**: 6-8 hours

---

## Pre-Deployment

- [ ] Review [STAGING_ENVIRONMENT_SETUP.md](./STAGING_ENVIRONMENT_SETUP.md)
- [ ] Ensure network connectivity is stable
- [ ] Backup production database (if copying data)
- [ ] Notify team about staging setup

---

## Phase 1: Database Setup ⏱️ 2-3 hours

### 1.1 Create Database
- [ ] Login to Render dashboard
- [ ] Create new PostgreSQL database: `transconnect-staging-db`
- [ ] Choose plan: Starter ($7/month) or Standard ($15/month)
- [ ] Note connection details
- [ ] Save `DATABASE_URL` to `.env.staging`

### 1.2 Run Migrations
```bash
cd c:\Users\DELL\mobility-app\transconnect-backend
$env:DATABASE_URL="postgresql://user:pass@host/db"
npx prisma migrate deploy
npx prisma generate
```
- [ ] All migrations completed successfully
- [ ] No errors in console
- [ ] Verify schema with `npx prisma studio`

### 1.3 Seed Test Data

**Option A: Seed Locally** (if network allows):
```bash
npm install --save-dev @faker-js/faker
node scripts/seed-staging-data.js
```
- [ ] Script completed without errors
- [ ] Verify data counts in output

**Option B: Seed via Render SSH** (if using Starter+ backend):
1. [ ] Deploy backend first (Phase 2)
2. [ ] Go to Render Dashboard → Your Service → Shell tab
3. [ ] Run: `node scripts/seed-staging-data.js`
4. [ ] Wait for completion (~2-3 minutes)

**Option C: Skip for Now**:
- [ ] Continue without test data
- [ ] Seed later when network is fixed
- [ ] Or add data manually through admin UI

**Test Credentials** (after seeding):
- Admin: `admin@transconnect-staging.com` / `password123`
- Manager: `manager@transconnect-staging.com` / `password123`

---

## Phase 2: Backend Deployment ⏱️ 1-2 hours

### 2.1 Create Render Web Service
- [ ] Go to Render Dashboard → "New +" → "Web Service"
- [ ] Source Code: `3bsolutionsltd/transconnect-app`
- [ ] Configure the following fields:

**Basic Configuration**:
- [ ] **Name**: `transconnect-backend-staging` (or `transconnect-app-testing`)
- [ ] **Project**: My project (optional)
- [ ] **Environment**: Production
- [ ] **Language**: Node (NOT Docker)
- [ ] **Branch**: `main`
- [ ] **Region**: Oregon (US West) - Keep with existing services
- [ ] **Root Directory**: `transconnect-backend` ⚠️ IMPORTANT

**Build Settings** (after clicking "Next"):
- [ ] **Build Command**: `npm install && npx prisma generate && npm run build`
- [ ] **Start Command**: `npm start`

**Instance Type** (choose one):
- [ ] **FREE** ($0/month) - Basic testing, no SSH
- [ ] **Starter** ($7/month) - ⭐ Recommended for seeding scripts
- [ ] **Standard** ($25/month) - Only if need more resources

**Which Tier to Choose?**
- [ ] Start with **FREE** if just testing API endpoints
- [ ] Use **Starter** if you need to run seed script via SSH
- [ ] Can upgrade/downgrade anytime in Render dashboard

### 2.2 Configure Environment Variables
Copy from `.env.staging.example` and set in Render:
- [ ] `NODE_ENV=staging`
- [ ] `DATABASE_URL` (from Phase 1)
- [ ] `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- [ ] `JWT_EXPIRES_IN=30d`
- [ ] `ESMS_API_KEY` (staging credentials)
- [ ] `GOOGLE_MAPS_API_KEY` (staging key)
- [ ] Payment gateway sandbox keys
- [ ] `FRONTEND_URL` and `ADMIN_URL`
- [ ] Feature flags (`ENABLE_ROUTE_SEGMENTS=true`)

### 2.3 Deploy & Verify
- [ ] Trigger manual deploy
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Check logs for errors
- [ ] Test health endpoint:
```bash
curl https://transconnect-backend-staging.onrender.com/api/health
```
- [ ] Response: `{"status":"ok"}`

### 2.4 Test API Endpoints
```bash
# Test segment search
curl "https://transconnect-backend-staging.onrender.com/api/routes/search-segments?origin=Masaka&destination=Mbarara&date=2026-02-01"

# Test auth login
curl -X POST https://transconnect-backend-staging.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@transconnect-staging.com","password":"password123"}'
```
- [ ] Segment search returns results
- [ ] Login returns JWT token
- [ ] No 500 errors

---

## Phase 3: Admin Dashboard Deployment ⏱️ 1 hour

### 3.1 Create Static Site (if separate repo)
- [ ] New Static Site from GitHub
- [ ] Name: `transconnect-admin-staging`
- [ ] Root Directory: `transconnect-admin`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist` or `build`

### 3.2 Configure Environment
- [ ] `REACT_APP_API_URL=https://transconnect-backend-staging.onrender.com/api`
- [ ] `REACT_APP_ENV=staging`

### 3.3 Deploy & Test
- [ ] Build completes successfully
- [ ] Visit dashboard URL
- [ ] Login with admin credentials
- [ ] Verify:
  - [ ] Routes page loads
  - [ ] Buses page loads
  - [ ] Bookings page loads
  - [ ] No console errors in browser

---

## Phase 4: Mobile App Staging Build ⏱️ 30 min

### 4.1 Update App Configuration
Already done in `eas.json` - staging profile added

### 4.2 Build Staging APK
```bash
cd c:\Users\DELL\mobility-app\transconnect-mobile
npx eas-cli build --platform android --profile staging
```
- [ ] Build started successfully
- [ ] EAS build ID: _______________
- [ ] Wait for completion (7-13 minutes)
- [ ] Download APK link: _______________

### 4.3 Test Mobile App
- [ ] Install APK on test device
- [ ] App name shows "(Staging)" suffix
- [ ] Search routes with stopovers
- [ ] Select route and view segments
- [ ] Test booking flow (don't complete payment)
- [ ] Verify API calls go to staging backend

---

## Phase 5: Migration Testing ⏱️ 2-3 hours

### 5.1 Run Migration Script
```bash
cd c:\Users\DELL\mobility-app\transconnect-backend
$env:DATABASE_URL="staging_database_url"
node scripts/migrate-to-route-segments.js
```
- [ ] Script completes without errors
- [ ] Verify segment creation in Prisma Studio
- [ ] Check price calculations are correct
- [ ] Test search with migrated data

### 5.2 Verify Results
- [ ] Open Prisma Studio: `npx prisma studio`
- [ ] Check `route_segments` table populated
- [ ] Verify `segment_price_variations` created
- [ ] Run test searches for popular routes
- [ ] Compare results with expected prices

---

## Phase 6: Monitoring Setup ⏱️ 30 min

### 6.1 Uptime Monitoring (Optional)
- [ ] Sign up for UptimeRobot (free tier)
- [ ] Add monitor: `https://transconnect-backend-staging.onrender.com/api/health`
- [ ] Set alert email
- [ ] Test notification

### 6.2 Error Tracking (Optional)
- [ ] Create Sentry staging project
- [ ] Add DSN to backend environment variables
- [ ] Deploy with Sentry enabled
- [ ] Trigger test error to verify

---

## Post-Deployment Validation

### Backend Health
- [ ] All migrations applied
- [ ] Database connections stable
- [ ] No memory leaks (check Render metrics)
- [ ] Response times < 500ms

### Data Integrity
- [ ] Test data seeded correctly
- [ ] Relationships intact (routes → segments → variations)
- [ ] Admin users can login
- [ ] Operator users can login

### API Functionality
- [ ] Segment search works
- [ ] Authentication works
- [ ] CORS configured correctly
- [ ] Payment endpoints in sandbox mode

### Admin Dashboard
- [ ] Can view all routes with segments
- [ ] Can create new routes
- [ ] Can edit segment pricing
- [ ] Real-time updates working (if implemented)

### Mobile App
- [ ] Connects to staging API
- [ ] Shows staging environment indicator
- [ ] Search returns segment-based results
- [ ] Booking flow works (without payment)

---

## Rollback Plan (If Issues Occur)

### Database Issues
```bash
# Restore from backup
psql -h staging-host -U user -d db < backup.sql
```

### Backend Issues
- [ ] Revert to previous Render deployment
- [ ] Check environment variables
- [ ] Review logs for errors

### Migration Issues
```bash
# Rollback migration
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

## Cost Summary

**Budget Option** (FREE Backend):
| Component | Monthly Cost |
|-----------|-------------|
| PostgreSQL Database | $7 |
| Backend Web Service | **$0** |
| Admin Static Site | $0 |
| **Total** | **$7/month** |

**Recommended Option** (Starter Backend):
| Component | Monthly Cost |
|-----------|-------------|
| PostgreSQL Database | $7 |
| Backend Web Service | $7 |
| Admin Static Site | $0 |
| **Total** | **$14/month** |

**Limitations**:
- FREE tier: No SSH (can't run seed scripts directly)
- Starter tier: Full SSH access, zero-downtime deploys

---

## Next Steps After Staging Setup

1. **Test Route Segments**:
   - Search for stopovers as destinations
   - Verify segment pricing calculations
   - Test date-based price variations

2. **Train Team**:
   - Share staging URLs with team
   - Create demo video
   - Document common workflows

3. **Continue Development**:
   - [ ] Option A: Build Admin UI for segment management
   - [ ] Option B: Move to Week 3 (Google Maps + double-booking)
   - [ ] Option C: Test migration in staging, then deploy to production

---

## Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` format
- Check Render database is running
- Verify IP whitelist (Render allows all by default)

### Build Failed
- Check Node.js version (should be 18+)
- Verify `package.json` scripts exist
- Check Render build logs

### API Returns 500 Errors
- Check environment variables set
- Verify database migrations ran
- Review backend logs in Render dashboard

### CORS Errors in Admin Dashboard
- Verify `CORS_ORIGINS` includes admin URL
- Check `FRONTEND_URL` and `ADMIN_URL` set correctly
- Ensure HTTPS used (not HTTP)

---

**Checklist Completed**: _____ / _____ items  
**Completion Date**: _______________  
**Sign-off**: _______________

---

**Notes**:
