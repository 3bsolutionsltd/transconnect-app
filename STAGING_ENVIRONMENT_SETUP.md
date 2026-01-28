# TransConnect Staging Environment Setup Guide

**Date**: January 28, 2026  
**Purpose**: Set up complete staging environment for testing route segments, migrations, and future features  
**Estimated Cost**: $30-50/month  
**Setup Time**: 1-2 days

---

## Overview

The staging environment will mirror production with:
- ✅ Separate PostgreSQL database with test data
- ✅ Backend API deployed to staging subdomain
- ✅ Admin dashboard on staging subdomain
- ✅ Mobile app staging build profile
- ✅ CI/CD pipeline for automated deployments
- ✅ Monitoring and error tracking

---

## Phase 1: Database Setup (2-3 hours)

### Step 1.1: Create Staging Database on Render

1. **Login to Render Dashboard**: https://dashboard.render.com/
2. **Create New PostgreSQL Database**:
   - Click "New +" → "PostgreSQL"
   - Name: `transconnect-staging-db`
   - Database: `transconnect_staging`
   - User: `transconnect_staging_user`
   - Region: Choose closest to production (e.g., Frankfurt/Singapore)
   - Plan: **Starter ($7/month)** or **Standard ($15/month)** for better performance
   - PostgreSQL Version: 14 or higher

3. **Note Connection Details** (save to `.env.staging`):
   ```
   STAGING_DATABASE_URL=postgres://transconnect_staging_user:***@dpg-*****.render.com/transconnect_staging
   STAGING_DB_HOST=dpg-*****.render.com
   STAGING_DB_PORT=5432
   STAGING_DB_NAME=transconnect_staging
   STAGING_DB_USER=transconnect_staging_user
   STAGING_DB_PASSWORD=***
   ```

### Step 1.2: Copy Production Schema to Staging

**Option A: Using Prisma (Recommended)**
```bash
# From transconnect-backend directory
cd c:\Users\DELL\mobility-app\transconnect-backend

# Set staging database URL
$env:DATABASE_URL="postgres://user:pass@host/transconnect_staging"

# Run all migrations
npx prisma migrate deploy

# Verify schema
npx prisma db pull
```

**Option B: Using pg_dump (If you have production access)**
```bash
# Dump production schema only (no data)
pg_dump -h production-host -U prod_user -d transconnect_prod --schema-only -f schema.sql

# Restore to staging
psql -h staging-host -U staging_user -d transconnect_staging -f schema.sql
```

### Step 1.3: Generate Test Data

Create test data generation script:

```bash
# Create the script file
cd c:\Users\DELL\mobility-app\transconnect-backend
```

**File: `scripts/seed-staging-data.js`**
```javascript
const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function seedStagingData() {
  console.log('🌱 Seeding staging database...');

  try {
    // 1. Create test operators
    const operators = [];
    for (let i = 0; i < 10; i++) {
      const operator = await prisma.operator.create({
        data: {
          companyName: faker.company.name() + ' Transport',
          email: faker.internet.email(),
          phoneNumber: `+256${faker.string.numeric(9)}`,
          licenseNumber: `LIC${faker.string.numeric(6)}`,
          status: faker.helpers.arrayElement(['active', 'pending', 'suspended']),
          address: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(['Kampala', 'Entebbe', 'Jinja', 'Mbarara'])
        }
      });
      operators.push(operator);
    }
    console.log(`✅ Created ${operators.length} operators`);

    // 2. Create test buses
    const buses = [];
    for (const operator of operators) {
      const busCount = faker.number.int({ min: 2, max: 5 });
      for (let i = 0; i < busCount; i++) {
        const bus = await prisma.bus.create({
          data: {
            operatorId: operator.id,
            registrationNumber: `KAA ${faker.string.numeric(3)}${faker.string.alpha(1).toUpperCase()}`,
            model: faker.helpers.arrayElement(['Mercedes Benz', 'Volvo', 'Scania', 'MAN', 'Isuzu']),
            capacity: faker.helpers.arrayElement([45, 50, 52, 62]),
            amenities: faker.helpers.arrayElements(['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'TV'], 3),
            status: 'active'
          }
        });
        buses.push(bus);
      }
    }
    console.log(`✅ Created ${buses.length} buses`);

    // 3. Create test routes with segments
    const ugandaTowns = [
      'Kampala', 'Entebbe', 'Masaka', 'Mbarara', 'Kabale',
      'Jinja', 'Mbale', 'Soroti', 'Lira', 'Gulu',
      'Fort Portal', 'Kasese', 'Hoima', 'Arua', 'Tororo',
      'Lyantonde', 'Ntungamo', 'Bushenyi', 'Rukungiri'
    ];

    const routes = [];
    for (const operator of operators) {
      const routeCount = faker.number.int({ min: 5, max: 10 });
      for (let i = 0; i < routeCount; i++) {
        const origin = faker.helpers.arrayElement(ugandaTowns);
        let destination = faker.helpers.arrayElement(ugandaTowns);
        while (destination === origin) {
          destination = faker.helpers.arrayElement(ugandaTowns);
        }

        // Create route
        const route = await prisma.route.create({
          data: {
            operatorId: operator.id,
            origin,
            destination,
            distance: faker.number.int({ min: 50, max: 500 }),
            duration: faker.number.int({ min: 60, max: 480 }),
            basePrice: faker.number.int({ min: 10000, max: 50000 }),
            segmentEnabled: true,
            autoCalculated: false,
            status: 'active'
          }
        });
        routes.push(route);

        // Create 2-4 segments per route
        const segmentCount = faker.number.int({ min: 2, max: 4 });
        const viaPoints = faker.helpers.arrayElements(
          ugandaTowns.filter(t => t !== origin && t !== destination),
          segmentCount - 1
        );

        const locations = [origin, ...viaPoints, destination];
        const totalDistance = route.distance;
        const segmentDistance = totalDistance / segmentCount;

        for (let j = 0; j < locations.length - 1; j++) {
          const segment = await prisma.routeSegment.create({
            data: {
              routeId: route.id,
              segmentOrder: j + 1,
              fromLocation: locations[j],
              toLocation: locations[j + 1],
              distanceKm: segmentDistance,
              durationMinutes: faker.number.int({ min: 30, max: 120 }),
              basePrice: route.basePrice / segmentCount
            }
          });

          // Add weekend pricing variation (20% premium)
          await prisma.segmentPriceVariation.create({
            data: {
              segmentId: segment.id,
              variationType: 'weekend',
              priceAdjustment: 20,
              adjustmentType: 'percentage',
              appliesToDates: { days: ['saturday', 'sunday'] },
              active: true
            }
          });
        }
      }
    }
    console.log(`✅ Created ${routes.length} routes with segments`);

    // 4. Create test schedules
    const schedules = [];
    const today = new Date();
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      for (const route of routes.slice(0, 50)) { // Only first 50 routes
        const bus = faker.helpers.arrayElement(buses.filter(b => b.operatorId === route.operatorId));
        
        const schedule = await prisma.busSchedule.create({
          data: {
            busId: bus.id,
            routeId: route.id,
            departureTime: date,
            arrivalTime: new Date(date.getTime() + route.duration * 60000),
            availableSeats: bus.capacity,
            status: 'scheduled'
          }
        });
        schedules.push(schedule);
      }
    }
    console.log(`✅ Created ${schedules.length} schedules`);

    // 5. Create test users
    const users = [];
    for (let i = 0; i < 100; i++) {
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          phoneNumber: `+256${faker.string.numeric(9)}`,
          password: '$2a$10$dummyhashforstagin.gonly123456789', // "password123"
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          role: 'PASSENGER',
          emailVerified: true
        }
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // 6. Create test bookings
    const bookings = [];
    for (let i = 0; i < 500; i++) {
      const user = faker.helpers.arrayElement(users);
      const schedule = faker.helpers.arrayElement(schedules);
      const passengerCount = faker.number.int({ min: 1, max: 4 });

      const booking = await prisma.booking.create({
        data: {
          userId: user.id,
          scheduleId: schedule.id,
          seats: Array.from({ length: passengerCount }, (_, i) => `${faker.number.int({ min: 1, max: 12 })}${faker.helpers.arrayElement(['A', 'B', 'C', 'D'])}`),
          passengerName: `${user.firstName} ${user.lastName}`,
          passengerPhone: user.phoneNumber,
          passengerEmail: user.email,
          totalPrice: schedule.route.basePrice * passengerCount,
          paymentStatus: faker.helpers.arrayElement(['completed', 'pending', 'failed']),
          paymentMethod: faker.helpers.arrayElement(['mobile_money', 'card', 'cash']),
          status: faker.helpers.arrayElement(['confirmed', 'pending', 'cancelled']),
          qrCode: faker.string.alphanumeric(32)
        }
      });
      bookings.push(booking);
    }
    console.log(`✅ Created ${bookings.length} bookings`);

    // 7. Create admin users
    await prisma.user.create({
      data: {
        email: 'admin@transconnect-staging.com',
        phoneNumber: '+256700000001',
        password: '$2a$10$dummyhashforstagin.gonly123456789', // "password123"
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        emailVerified: true
      }
    });

    await prisma.user.create({
      data: {
        email: 'manager@transconnect-staging.com',
        phoneNumber: '+256700000002',
        password: '$2a$10$dummyhashforstagin.gonly123456789',
        firstName: 'Manager',
        lastName: 'User',
        role: 'ADMIN', // Will be TRANSCONNECT_MANAGER after role update
        emailVerified: true
      }
    });

    console.log('✅ Created admin users');
    console.log('\n🎉 Staging data seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('  Admin: admin@transconnect-staging.com / password123');
    console.log('  Manager: manager@transconnect-staging.com / password123');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedStagingData();
```

**Install faker and run seed**:
```bash
npm install --save-dev @faker-js/faker

# Set staging database URL
$env:DATABASE_URL="your_staging_database_url"

# Run seed script
node scripts/seed-staging-data.js
```

---

## Phase 2: Backend Deployment (1-2 hours)

### Step 2.1: Create Staging Environment on Render

1. **Go to Render Dashboard** → "New +" → "Web Service"
2. **Connect GitHub Repository**: `3bsolutionsltd/transconnect-app`
3. **Configure Service**:
   - Name: `transconnect-backend-staging`
   - Root Directory: `transconnect-backend`
   - Environment: `Node`
   - Region: Same as database
   - Branch: `main` (or create `staging` branch)
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Plan: **Starter ($7/month)** or **Standard ($25/month)**

4. **Environment Variables**:
   ```
   NODE_ENV=staging
   PORT=10000
   DATABASE_URL=[Copy from staging database]
   JWT_SECRET=[Generate new: openssl rand -base64 32]
   JWT_EXPIRES_IN=30d
   
   # eSMS Africa (use test credentials)
   ESMS_API_KEY=[Staging API key]
   ESMS_SENDER_ID=TransTest
   
   # Google Maps (separate quota)
   GOOGLE_MAPS_API_KEY=[Staging key with lower quota]
   
   # Payment gateways (sandbox)
   FLUTTERWAVE_SECRET_KEY=[Sandbox key]
   FLUTTERWAVE_PUBLIC_KEY=[Sandbox key]
   MTN_MOMO_SUBSCRIPTION_KEY=[Sandbox key]
   AIRTEL_MONEY_CLIENT_ID=[Sandbox key]
   
   # Frontend URL
   FRONTEND_URL=https://staging.transconnect.com
   ADMIN_URL=https://admin-staging.transconnect.com
   
   # Feature flags
   ENABLE_ROUTE_SEGMENTS=true
   ENABLE_DYNAMIC_SCHEDULING=false
   ENABLE_PHONE_AUTH=false
   ```

5. **Custom Domain** (optional):
   - Add custom domain: `api-staging.transconnect.com`
   - Or use Render subdomain: `transconnect-backend-staging.onrender.com`

### Step 2.2: Set Up Auto-Deploy

**Create `.github/workflows/deploy-staging.yml`**:
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main, staging]
    paths:
      - 'transconnect-backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd transconnect-backend
          npm ci
      
      - name: Run tests
        run: |
          cd transconnect-backend
          npm test
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      
      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }}?key=${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## Phase 3: Admin Dashboard Deployment (1 hour)

### Step 3.1: Create Admin Staging Deployment

1. **Render Dashboard** → "New +" → "Static Site"
2. **Configure**:
   - Name: `transconnect-admin-staging`
   - Root Directory: `transconnect-admin`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist` or `build`
   - Branch: `main`

3. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://transconnect-backend-staging.onrender.com/api
   REACT_APP_ENV=staging
   ```

4. **Custom Domain**:
   - Add: `admin-staging.transconnect.com`

---

## Phase 4: Mobile App Staging Build (30 min)

### Step 4.1: Create EAS Staging Profile

**Edit `transconnect-mobile/eas.json`**:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "staging": {
      "extends": "production",
      "env": {
        "APP_ENV": "staging",
        "API_URL": "https://transconnect-backend-staging.onrender.com/api"
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Update `transconnect-mobile/app.config.js`**:
```javascript
export default ({ config }) => {
  const env = process.env.APP_ENV || 'production';
  
  return {
    ...config,
    name: env === 'staging' ? 'TransConnect (Staging)' : 'TransConnect',
    slug: 'transconnect',
    extra: {
      apiUrl: process.env.API_URL || 'https://transconnect-app-44ie.onrender.com/api',
      environment: env
    }
  };
};
```

**Build staging APK**:
```bash
cd c:\Users\DELL\mobility-app\transconnect-mobile
npx eas-cli build --platform android --profile staging
```

---

## Phase 5: Testing & Validation (2-3 hours)

### Pre-Deployment Checklist

```markdown
Database:
- [ ] Staging database created and accessible
- [ ] All migrations run successfully
- [ ] Test data seeded (500+ routes, 1000+ bookings)
- [ ] Daily backups configured

Backend:
- [ ] Service deployed and running
- [ ] Health check endpoint responding: /api/health
- [ ] Database connection working
- [ ] All environment variables set
- [ ] Logs accessible in Render dashboard

Admin Dashboard:
- [ ] Static site deployed
- [ ] Can login with test admin credentials
- [ ] API calls working (check browser console)
- [ ] Routes, buses, bookings visible

Mobile App:
- [ ] Staging APK built successfully
- [ ] Can install on test device
- [ ] Connects to staging API
- [ ] Can search routes with segments
- [ ] Can complete booking flow

API Tests:
- [ ] GET /api/routes/search-segments works
- [ ] GET /api/segments/route/:routeId returns data
- [ ] POST /api/auth/login works with test credentials
- [ ] Payment endpoints in sandbox mode
```

### Test Scenarios

**1. Route Segment Search**:
```bash
# Test stopover search
curl "https://transconnect-backend-staging.onrender.com/api/routes/search-segments?origin=Masaka&destination=Mbarara&date=2026-02-01"
```

**2. Admin Login**:
- Visit admin-staging.transconnect.com
- Login: admin@transconnect-staging.com / password123
- Navigate to Routes → View segments

**3. Mobile Booking Flow**:
- Install staging APK
- Search: Kampala → Mbarara
- Select route with stopovers
- Check price calculation includes segments
- Complete booking (use sandbox payment)

---

## Phase 6: Migration Testing (2-3 hours)

### Test Route Segment Migration

```bash
# Connect to staging database
$env:DATABASE_URL="staging_database_url"

# Run migration script
node scripts/migrate-to-route-segments.js

# Verify results
npx prisma studio
# Check route_segments table populated
# Verify prices split correctly
# Test search with migrated data
```

---

## Cost Summary

| Component | Provider | Plan | Cost/Month |
|-----------|----------|------|------------|
| PostgreSQL Database | Render | Starter | $7-15 |
| Backend API | Render | Starter | $7 |
| Admin Dashboard | Render | Static Site | Free |
| **Total** | | | **$14-22/month** |

**Note**: Mobile app staging builds are free on EAS

---

## Monitoring & Maintenance

### Set Up Monitoring

1. **Render Logs**: Available in dashboard for free
2. **Uptime Monitoring**: Use UptimeRobot (free tier)
   - Monitor: `https://transconnect-backend-staging.onrender.com/api/health`
   - Alert on downtime

3. **Error Tracking** (optional):
   - Sentry staging project (free tier)
   - Add to backend: `npm install @sentry/node`

### Daily Backups

Render provides automatic daily backups for PostgreSQL. To manual backup:
```bash
pg_dump -h staging-host -U staging_user -d transconnect_staging -f staging-backup-$(date +%Y%m%d).sql
```

---

## Next Steps After Setup

1. **Push pending commits** (once network restored):
   ```bash
   git push origin main
   ```

2. **Test segment search API** on staging

3. **Run data migration** in staging environment

4. **Choose next task**:
   - Option A: Build Admin UI for segment management
   - Option B: Continue to Week 3 (Google Maps + double-booking)

---

## Quick Start Commands

```bash
# 1. Set up staging database
$env:DATABASE_URL="your_staging_database_url"
cd c:\Users\DELL\mobility-app\transconnect-backend
npx prisma migrate deploy
npm install --save-dev @faker-js/faker
node scripts/seed-staging-data.js

# 2. Deploy backend (via Render dashboard or CLI)
# Configure in Render UI

# 3. Build staging mobile app
cd c:\Users\DELL\mobility-app\transconnect-mobile
npx eas-cli build --platform android --profile staging

# 4. Test API
curl "https://your-staging-url.onrender.com/api/health"
```

---

## Support

- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/

**Estimated Total Setup Time**: 6-8 hours  
**Estimated Total Cost**: $14-22/month
