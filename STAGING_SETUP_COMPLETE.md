# Staging Environment Setup - Complete ✅

**Date**: January 28, 2026  
**Status**: Ready to Deploy  
**Cost**: $14-22/month  
**Setup Time**: 6-8 hours

---

## What Was Created

### 1. Documentation
- **[STAGING_ENVIRONMENT_SETUP.md](./STAGING_ENVIRONMENT_SETUP.md)** - Complete setup guide with step-by-step instructions
- **[STAGING_DEPLOYMENT_CHECKLIST.md](./STAGING_DEPLOYMENT_CHECKLIST.md)** - Deployment checklist with validation steps

### 2. Scripts & Tools
- **[setup-staging.js](./setup-staging.js)** - Interactive CLI tool for guided setup
- **[transconnect-backend/scripts/seed-staging-data.js](./transconnect-backend/scripts/seed-staging-data.js)** - Test data generation script

### 3. Configuration
- **[transconnect-mobile/eas.json](./transconnect-mobile/eas.json)** - Added staging build profile
- **transconnect-backend/.env.staging.example** - Environment variables template (not in git)

---

## Quick Start

### Option 1: Interactive Script (Recommended)
```bash
cd c:\Users\DELL\mobility-app
node setup-staging.js
```

This will guide you through:
1. Database setup verification
2. Installing dependencies
3. Running migrations
4. Seeding test data

### Option 2: Manual Setup
Follow the detailed guide: [STAGING_ENVIRONMENT_SETUP.md](./STAGING_ENVIRONMENT_SETUP.md)

---

## Test Data Overview

The seed script creates:
- **10 operators** with realistic Uganda bus companies (Kampala Coach, Gateway Bus, etc.)
- **50+ buses** with varying capacities (33-62 seats)
- **500+ routes** with segments covering popular Uganda destinations
- **30 days of schedules** (next month)
- **150 test users** with Ugandan names
- **1000+ bookings** (mix of past and future)

### Popular Routes Included
- Kampala → Mbarara (via Masaka, Lyantonde)
- Kampala → Kabale (via Masaka, Mbarara, Ntungamo)
- Kampala → Gulu (via Luwero, Nakasongola)
- Kampala → Mbale (via Jinja, Iganga)
- Kampala → Fort Portal (via Mityana, Mubende)
- And many more...

### Test Credentials
```
Admin:    admin@transconnect-staging.com / password123
Manager:  manager@transconnect-staging.com / password123
Operator: kampalacoach@staging.com / password123 (and others)
```

---

## Deployment Steps

### 1. Create Render Database (5 minutes)
1. Go to https://dashboard.render.com/
2. New → PostgreSQL
3. Name: `transconnect-staging-db`
4. Plan: Starter ($7/month)
5. Copy DATABASE_URL

### 2. Run Setup Script (30 minutes)
```bash
node setup-staging.js
# Follow the prompts
```

### 3. Deploy Backend to Render (15 minutes)
1. New → Web Service
2. Connect GitHub: `3bsolutionsltd/transconnect-app`
3. Name: `transconnect-backend-staging`
4. Root Directory: `transconnect-backend`
5. Add environment variables (see checklist)
6. Deploy

### 4. Deploy Admin Dashboard (10 minutes)
1. New → Static Site
2. Name: `transconnect-admin-staging`
3. Root Directory: `transconnect-admin`
4. Set `REACT_APP_API_URL`
5. Deploy

### 5. Build Mobile App (10 minutes)
```bash
cd transconnect-mobile
npx eas-cli build --platform android --profile staging
```

---

## What's Different in Staging?

| Feature | Production | Staging |
|---------|-----------|---------|
| App Name | TransConnect | TransConnect (Staging) |
| Database | Production data | Test data (500+ routes) |
| API URL | transconnect-app-44ie.onrender.com | transconnect-backend-staging.onrender.com |
| Payment | Live payment gateways | Sandbox only |
| SMS | Live eSMS Africa | Test mode |
| Google Maps | Production quota | Lower quota |
| Feature Flags | Stable features only | New features enabled |

---

## Testing Checklist

After deployment, verify:

### Backend API
- [ ] Health check: `GET /api/health` returns `{"status":"ok"}`
- [ ] Login works: `POST /api/auth/login` with admin credentials
- [ ] Segment search: `GET /api/routes/search-segments?origin=Masaka&destination=Mbarara`
- [ ] No CORS errors

### Database
- [ ] All tables created
- [ ] Test data populated (500+ routes)
- [ ] Route segments with price variations
- [ ] Admin and operator users created

### Admin Dashboard
- [ ] Can login with admin credentials
- [ ] Routes page shows 500+ routes
- [ ] Can view route segments
- [ ] Can create new routes
- [ ] No console errors

### Mobile App
- [ ] App name shows "(Staging)" suffix
- [ ] Connects to staging API
- [ ] Search returns segment-based results
- [ ] Can view route details
- [ ] Booking flow works (sandbox payment)

---

## Cost Breakdown

| Component | Monthly Cost |
|-----------|-------------|
| PostgreSQL Database (Render Starter) | $7 |
| Backend Web Service (Render Starter) | $7 |
| Admin Static Site (Render) | Free |
| Mobile Builds (EAS) | Free |
| **Total** | **$14/month** |

**Optional add-ons**:
- Standard Database (better performance): +$8/month
- Uptime monitoring (UptimeRobot): Free
- Error tracking (Sentry): Free tier
- Redis for seat locking: +$5-10/month

---

## Next Steps After Setup

### Immediate (Today)
1. ✅ Review this summary
2. ✅ Read STAGING_ENVIRONMENT_SETUP.md
3. ⏳ Create Render database
4. ⏳ Run `node setup-staging.js`
5. ⏳ Deploy backend to Render

### This Week
1. Deploy admin dashboard
2. Build staging mobile app
3. Test segment search functionality
4. Run migration script in staging
5. Verify all features work

### Choose Next Task (After Staging Validated)
- **Option A**: Build Admin UI for segment management (3-4 days)
- **Option B**: Move to Week 3 - Google Maps integration (4-5 days)
- **Option C**: Test everything, then deploy segments to production

---

## Troubleshooting

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check database is running in Render
- Test connection with `npx prisma studio`

### "npm install failed"
- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `npm cache clean --force`
- Delete node_modules and reinstall

### "Seeding failed"
- Check database URL is set: `echo $env:DATABASE_URL`
- Ensure migrations ran: `npx prisma migrate deploy`
- Check Prisma client generated: `npx prisma generate`

### "EAS build failed"
- Check eas.json syntax
- Verify Expo account logged in: `npx eas-cli whoami`
- Check build logs in Expo dashboard

---

## Important Notes

⚠️ **Staging uses test data only** - No production data is copied  
⚠️ **Payment gateways in sandbox mode** - No real transactions  
⚠️ **SMS in test mode** - Won't send real messages (or limited quota)  
⚠️ **Separate from production** - Safe to test breaking changes  

✅ **Ready for migration testing** - Test route segment migration here first  
✅ **Zero-downtime strategy** - Test parallel system operation  
✅ **Safe environment** - Can break things without affecting users  

---

## Git Commits

This staging setup was committed in:
- `4be98be` - feat(staging): Add complete staging environment setup
- `5891f22` - feat(staging): Add interactive staging setup script

Pending commits (network issues):
- `32ce232` - feat(backend): Implement route segments database schema
- `6391a57` - feat(backend): Add segment-based search API

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **Faker.js**: https://fakerjs.dev/

---

## Feedback

If you encounter issues or have suggestions for improving the staging setup:
1. Document the issue
2. Add to troubleshooting section
3. Update setup guide if necessary

---

**Status**: ✅ Complete - Ready to deploy!  
**Next Action**: Run `node setup-staging.js` to begin
