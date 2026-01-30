# Post-Deployment Testing Plan - Route Segments

**Deployment Date**: January 29, 2026 at 3:23 PM  
**Commit**: b5757ae  
**Environment**: Staging (transconnect-app-testing.onrender.com)

---

## ⏳ Waiting for Deployment to Complete

Render typically takes 3-5 minutes to:
1. Build the Docker container
2. Run Prisma migrations
3. Start the Node.js server
4. Perform health checks

**Check deployment status**: https://dashboard.render.com

---

## ✅ Phase 1: Basic Health Check (5 min)

### 1.1 Backend Health
```bash
# Check if backend is running
curl https://transconnect-app-testing.onrender.com/api/health

# Expected: { "status": "ok", "timestamp": "..." }
```

### 1.2 Database Migration Status
```bash
# SSH into Render instance or check logs
npx prisma migrate status

# Should show: All migrations applied
```

### 1.3 Verify Seed Data
```bash
# Run check script
npx tsx scripts/check-routes.ts

# Should show 2 routes with segments
```

---

## ✅ Phase 2: API Endpoint Testing (15 min)

### 2.1 Public Endpoints (No Auth Required)

#### Test 1: Search with Segments
```bash
# Stopover as destination
curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Masaka&date=2026-01-30"

# Expected: 1 route found, price = UGX 10,000 (base) or 12,000 (weekend)
```

#### Test 2: Get Route Segments
```bash
curl https://transconnect-app-testing.onrender.com/api/routes/kampala-fortportal-0800/segments

# Expected: 3 segments (Kampala→Mityana, Mityana→Mubende, Mubende→Fort Portal)
```

#### Test 3: Get Price Variations
```bash
curl https://transconnect-app-testing.onrender.com/api/routes/segments/{segmentId}/variations

# Expected: Weekend variation for Kampala→Masaka segment
```

### 2.2 Protected Endpoints (Auth Required)

**First, get admin token:**
```bash
# Login as admin
curl -X POST https://transconnect-app-testing.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@transconnect.com", "password": "your-admin-password"}'

# Copy the JWT token from response
export ADMIN_TOKEN="<token>"
```

#### Test 4: Create Segments (POST)
```bash
curl -X POST https://transconnect-app-testing.onrender.com/api/routes/{routeId}/segments \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "segments": [
      {
        "segmentOrder": 1,
        "fromLocation": "Kampala",
        "toLocation": "Jinja",
        "distanceKm": 80,
        "durationMinutes": 90,
        "basePrice": 12000
      }
    ]
  }'

# Expected: Segments created successfully
```

#### Test 5: Update Segment (PUT)
```bash
curl -X PUT https://transconnect-app-testing.onrender.com/api/routes/segments/{segmentId} \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "basePrice": 13000
  }'

# Expected: Segment updated
```

#### Test 6: Create Price Variation (POST)
```bash
curl -X POST https://transconnect-app-testing.onrender.com/api/routes/segments/{segmentId}/variations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "variationType": "holiday",
    "priceAdjustment": 25,
    "adjustmentType": "percentage",
    "appliesToDates": {
      "dates": ["2026-12-25", "2026-12-26"]
    }
  }'

# Expected: Variation created
```

#### Test 7: Toggle Variation Status (PATCH)
```bash
curl -X PATCH https://transconnect-app-testing.onrender.com/api/routes/variations/{variationId}/toggle \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Variation toggled
```

#### Test 8: Delete Operations (DELETE)
```bash
# Delete variation
curl -X DELETE https://transconnect-app-testing.onrender.com/api/routes/variations/{variationId} \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Delete segment
curl -X DELETE https://transconnect-app-testing.onrender.com/api/routes/segments/{segmentId} \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected: Resources deleted
```

---

## ✅ Phase 3: Automated Test Suite (10 min)

### 3.1 Run Segment Search Tests
```bash
# Test all 4 scenarios
npx tsx scripts/test-segment-search.ts

# Expected: All 4 tests pass
# - Stopover as destination ✅
# - Between stopovers ✅
# - Stopover as origin ✅
# - Weekend pricing ✅
```

### 3.2 Run API Endpoint Tests
```bash
# Update test script with admin token
# Edit scripts/test-segment-api.ts line 6
# const ADMIN_TOKEN = '<your-token>';

npx tsx scripts/test-segment-api.ts

# Expected: All endpoint tests pass
```

---

## ✅ Phase 4: Edge Cases & Load Testing (20 min)

### 4.1 Edge Case Scenarios

#### Scenario 1: Non-existent Route
```bash
curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=InvalidCity&destination=Masaka&date=2026-01-30"

# Expected: Empty results, no error
```

#### Scenario 2: Future Date (Far Future)
```bash
curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Masaka&date=2027-12-31"

# Expected: Results found (no date restriction on segments)
```

#### Scenario 3: Invalid Date Format
```bash
curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Masaka&date=invalid"

# Expected: 400 Bad Request with error message
```

#### Scenario 4: Missing Required Parameters
```bash
curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala"

# Expected: 400 Bad Request
```

#### Scenario 5: Unauthorized Access
```bash
curl -X POST https://transconnect-app-testing.onrender.com/api/routes/{routeId}/segments \
  -H "Content-Type: application/json" \
  -d '{"segments": []}'

# Expected: 401 Unauthorized
```

### 4.2 Performance Testing

#### Test 1: Response Time
```bash
# Test search response time
time curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Masaka&date=2026-01-30"

# Expected: < 500ms response time
```

#### Test 2: Concurrent Requests (Simple Load Test)
```bash
# Install Apache Bench (if not already installed)
# Windows: choco install apache-bench
# Mac: brew install apache-bench

# Run 100 requests with 10 concurrent connections
ab -n 100 -c 10 "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Masaka&date=2026-01-30"

# Expected: 95%+ success rate, avg response < 1s
```

---

## ✅ Phase 5: Integration Testing with Admin UI (15 min)

### 5.1 Admin Dashboard Access
1. Open https://transconnect-admin-staging.onrender.com
2. Login with admin credentials
3. Navigate to Routes section

### 5.2 Route Management UI Tests
- [ ] View existing routes with segments
- [ ] Click on route to see segment details
- [ ] Edit segment prices
- [ ] Add new segment
- [ ] Create price variation (weekend/holiday)
- [ ] Toggle variation active/inactive
- [ ] Delete segment

### 5.3 Visual Validation
- [ ] Segment table displays correctly
- [ ] Price variations show in correct format
- [ ] No console errors
- [ ] Loading states work properly
- [ ] Error messages display correctly

---

## ✅ Phase 6: Mobile App Integration (30 min)

### 6.1 Update Mobile App API URL
```typescript
// transconnect-mobile/src/config/api.ts
export const API_BASE_URL = 'https://transconnect-app-testing.onrender.com';
```

### 6.2 Rebuild Mobile App
```bash
cd transconnect-mobile
eas build --profile staging --platform android
```

### 6.3 Test Search Flow
1. Open mobile app
2. Enter origin: "Kampala"
3. Enter destination: "Masaka" (stopover)
4. Select date: Tomorrow
5. Tap "Search Routes"

**Expected Results:**
- ✅ Route found (Kampala → Mbarara via Masaka)
- ✅ Correct price displayed (UGX 10,000 or 12,000 if weekend)
- ✅ Distance and duration shown (125 km, 90 min)
- ✅ Can proceed to seat selection

### 6.4 Test Booking Flow
1. Select route from search results
2. Choose seats
3. Proceed to payment
4. Complete booking

**Expected Results:**
- ✅ Booking created with correct segment pricing
- ✅ QR code generated
- ✅ Confirmation sent to user

---

## 📊 Success Criteria

### Must Pass (Blocking)
- [ ] All 4 segment search tests pass
- [ ] All 9 API endpoints respond correctly
- [ ] Authorization checks working (401/403 where expected)
- [ ] Weekend pricing calculates correctly
- [ ] No database errors in logs
- [ ] Admin UI displays segments properly

### Should Pass (Non-blocking but investigate)
- [ ] Response time < 500ms for search
- [ ] 95%+ success rate under load
- [ ] Mobile app search works end-to-end
- [ ] All edge cases handled gracefully

### Performance Benchmarks
- **Search Query**: < 500ms
- **API Endpoints**: < 200ms
- **Concurrent Users**: 100+ simultaneous searches
- **Database Queries**: < 100ms per query

---

## 🐛 Issue Tracking

### Issues Found
| # | Description | Severity | Status | Fix |
|---|-------------|----------|--------|-----|
| 1 | | | | |

### Logs to Check
```bash
# Check Render logs for errors
# https://dashboard.render.com/web/srv-XXXXX/logs

# Look for:
# - Migration errors
# - SQL query errors
# - Authorization failures
# - Unexpected 500 errors
```

---

## 📝 Post-Testing Report Template

```markdown
## Deployment Test Results - [Date]

**Tester**: [Name]
**Duration**: [X] minutes
**Environment**: Staging

### Summary
- Total Tests: X
- Passed: X
- Failed: X
- Blocked: X

### Test Results
✅ Phase 1: Health Check - PASSED
✅ Phase 2: API Endpoints - PASSED (X/9)
✅ Phase 3: Automated Tests - PASSED (4/4)
❌ Phase 4: Edge Cases - FAILED (see issues)
⏳ Phase 5: Admin UI - IN PROGRESS
⏳ Phase 6: Mobile App - NOT STARTED

### Critical Issues
1. [Issue description]
   - Impact: [High/Medium/Low]
   - Workaround: [If available]

### Recommendations
- [ ] Fix critical issues before production
- [ ] Additional performance tuning needed
- [ ] Documentation updates required
- [ ] Training materials need revision

### Next Steps
1. [Action item]
2. [Action item]

**Sign-off**: Ready for [Production / More Testing / Rework]
```

---

## 🚀 Ready for Production Checklist

Before deploying to production:
- [ ] All staging tests passed
- [ ] Performance benchmarks met
- [ ] No critical bugs found
- [ ] Database migration tested successfully
- [ ] Rollback plan documented
- [ ] Admin team trained
- [ ] Support team notified
- [ ] Monitoring alerts configured
- [ ] Backup taken
- [ ] Deployment window scheduled
- [ ] Users notified (if downtime expected)

---

**Next Steps After Testing**:
1. Document any issues found
2. Fix critical bugs
3. Retest failed scenarios
4. Get sign-off from stakeholders
5. Proceed to Task 8 (Google Maps integration) or deploy to production
