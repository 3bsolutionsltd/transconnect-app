# Operator & Route Filtering Fix - July 30, 2026

## Issue Reported
"Some operators and routes that were removed/disabled are appearing in the app which shouldn't."

## Root Cause
The backend API endpoints were not properly filtering by:
1. **Operator approval status** - Unapproved operators were being returned
2. **Route active status** - Inactive routes were being shown
3. **Bus active status** - Inactive buses were being included

## Fixes Applied

### 1. Routes Endpoint (`/api/routes`)
**File:** `transconnect-backend/src/routes/routes.ts`

**Changes:**
- Added `operator: { approved: true }` filter to all route queries at database level
- Removed inefficient post-fetch filtering with `.filter()`
- Applied to 3 query locations:
  1. Direct route search fallback (line 86)
  2. All active routes fallback (line 112)
  3. Legacy query main where clause (line 133)

**Before:**
```typescript
where: {
  active: true,
}
```

**After:**
```typescript
where: {
  active: true,
  operator: { approved: true }, // Only approved operators
}
```

### 2. Operators Endpoint (`/api/operators`)
**File:** `transconnect-backend/src/routes/operators.ts`

**Changes:**
- Added `approved: true` filter to GET all operators (line 67)
- Added `active: true` filter to buses and routes relations
- Added approval check to GET operator by ID (line 216)

**Before:**
```typescript
const operators = await prisma.operator.findMany({
  include: { buses: {...}, routes: {...} }
});
```

**After:**
```typescript
const operators = await prisma.operator.findMany({
  where: {
    approved: true, // Only approved operators
  },
  include: {
    buses: {
      where: { active: true }, // Only active buses
      ...
    },
    routes: {
      where: { active: true }, // Only active routes
      ...
    }
  }
});
```

### 3. Get Operator by ID (`/api/operators/:id`)
**Changes:**
- Added `active: true` filter to buses and routes
- Return 404 if operator is not approved (protecting unapproved operators from public access)

```typescript
if (!operator.approved) {
  return res.status(404).json({ error: 'Operator not found' });
}
```

## Database Schema Reference
From `schema.prisma`:
- `Operator.approved: Boolean @default(false)` - Approval status
- `Route.active: Boolean @default(true)` - Route active status
- `Bus.active: Boolean @default(true)` - Bus active status

## Testing Steps

### Backend Testing (VPS)
1. Deploy changes to VPS
2. Test routes endpoint:
   ```bash
   curl https://api.transconnect.app/api/routes | jq '.[] | {id, operator: .operator.approved, active}'
   ```
   Should return only routes where `approved: true` and `active: true`

3. Test operators endpoint:
   ```bash
   curl https://api.transconnect.app/api/operators | jq '.operators[] | {id, companyName, approved}'
   ```
   Should return only operators where `approved: true`

### Mobile App Testing
1. Install new APK v1.0.21
2. Search for routes - should NOT see disabled operators
3. Check booking history - operators should all be approved
4. Verify no "ghost" operators or routes appear

## Commits Applied
- `ed927c8` - fix(backend): filter unapproved operators and inactive buses/routes from public APIs
- `f8c8cea` - fix(backend): also filter unapproved operators in GET by ID endpoint

## Deployment Instructions

### Deploy to VPS
```bash
# SSH into VPS
ssh root@178.128.102.164

# Navigate to backend directory
cd /opt/transconnect/production

# Pull latest changes
git pull origin main

# Rebuild and restart Docker container
docker compose -p transconnect-production down
docker compose -p transconnect-production up -d --build

# Verify container is running
docker ps | grep tc_backend_prod

# Check logs for errors
docker logs -f tc_backend_prod --tail 50
```

## Mobile App Update
After VPS deployment, build new APK:
- Version: 1.0.21
- Includes: OTP navigation fix + operator filtering
- Ready for Play Store submission

## Impact
- **Security:** Prevents access to unapproved operator data
- **Data Quality:** Only shows active, approved content
- **Performance:** Database-level filtering is more efficient than post-fetch filtering
- **User Experience:** Cleaner, more accurate route and operator listings

## Related Issues Fixed
- OTP navigation bug (v1.0.20)
- Phone login undefined error (v1.0.21)
- **NEW:** Unapproved operators appearing in app (v1.0.21)
