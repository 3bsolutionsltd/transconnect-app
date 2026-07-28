# Feature Flags Setup - Complete ✅

## What Was Created

### Backend (Node.js/Express)
- ✅ `transconnect-backend/src/utils/feature-flags.ts` - Feature flag utility
- ✅ Updated `transconnect-backend/.env.example` - Added feature flag variables

### Frontend (Next.js)
- ✅ `transconnect-web/src/lib/feature-flags.ts` - Frontend feature flag utility
- ✅ Updated `transconnect-web/.env.example` - Added feature flag variables
- ✅ Updated `transconnect-web/.env.production.example` - Production config
- ✅ Updated `transconnect-web/.env.local` - Local dev config (ENABLED)
- ✅ Updated `transconnect-web/.env.production` - Production config (DISABLED)

---

## Feature Flags Available

| Flag | Description | Dev | Staging | Production |
|------|-------------|-----|---------|------------|
| `OPERATOR_PORTAL` | Main operator portal feature | ✅ | ✅ | ❌ |
| `OPERATOR_PORTAL_CONFIG` | Portal configuration UI | ✅ | ✅ | ❌ |
| `OPERATOR_PORTAL_ANALYTICS` | Analytics dashboard | ❌ | ❌ | ❌ |
| `OPERATOR_PORTAL_CUSTOM_DOMAINS` | Custom domains (premium) | ❌ | ❌ | ❌ |

---

## Usage Examples

### Backend (Express Routes)

```typescript
// Import the feature flag utility
import { requireFeature, isFeatureEnabled } from '../utils/feature-flags';

// Protect an entire route
router.use('/operator-portal', requireFeature('OPERATOR_PORTAL'));

// Or check in individual endpoints
router.get('/slug/:slug', async (req, res) => {
  if (!isFeatureEnabled('OPERATOR_PORTAL')) {
    return res.status(404).json({ error: 'Feature not available' });
  }
  
  // Your code here...
});
```

### Frontend (React Components)

```typescript
// Import the utility
import { isFeatureEnabled, useFeatureFlag, withFeatureFlag } from '@/lib/feature-flags';

// Option 1: Direct check
export default function OperatorPortalPage() {
  if (!isFeatureEnabled('OPERATOR_PORTAL')) {
    return <NotFound />;
  }
  
  return <OperatorPortal />;
}

// Option 2: Use the hook
export default function OperatorPortalPage() {
  const isEnabled = useFeatureFlag('OPERATOR_PORTAL');
  
  if (!isEnabled) {
    return <NotFound />;
  }
  
  return <OperatorPortal />;
}

// Option 3: Higher-Order Component (HOC)
const OperatorPortalPage = withFeatureFlag(
  'OPERATOR_PORTAL',
  OperatorPortalComponent,
  <NotFound />
);

// Option 4: Conditional rendering
export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/routes">Routes</Link>
      
      {/* Only show if feature is enabled */}
      {isFeatureEnabled('OPERATOR_PORTAL_CONFIG') && (
        <Link href="/operator/portal-config">My Portal</Link>
      )}
    </nav>
  );
}
```

---

## Environment Variables

### Backend (.env)

```env
# Development/Local - ENABLED
ENABLE_OPERATOR_PORTAL=true
ENABLE_OPERATOR_PORTAL_CONFIG=true

# Staging - ENABLED for testing
ENABLE_OPERATOR_PORTAL=true
ENABLE_OPERATOR_PORTAL_CONFIG=true

# Production - DISABLED until ready
ENABLE_OPERATOR_PORTAL=false
ENABLE_OPERATOR_PORTAL_CONFIG=false
```

### Frontend (.env)

```env
# Development/Local - ENABLED
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=true
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL_CONFIG=true

# Staging - ENABLED for testing
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=true
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL_CONFIG=true

# Production - DISABLED until ready
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=false
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL_CONFIG=false
```

---

## Testing Feature Flags

### Test Backend

```bash
# Start backend with flags enabled
cd transconnect-backend
echo "ENABLE_OPERATOR_PORTAL=true" >> .env
npm run dev

# Test endpoint (should work)
curl http://localhost:5000/api/operator-portal/slug/test

# Disable flag
echo "ENABLE_OPERATOR_PORTAL=false" >> .env
# Restart server
npm run dev

# Test endpoint (should return 404)
curl http://localhost:5000/api/operator-portal/slug/test
```

### Test Frontend

```bash
# Start frontend with flags enabled
cd transconnect-web
npm run dev

# Visit operator portal page
# Should see content if NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=true

# Disable in .env.local
# NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=false

# Rebuild (Next.js embeds env vars at build time)
npm run build
npm start

# Visit operator portal page
# Should show 404 or "Feature not available"
```

---

## Enabling/Disabling Features

### For Development (Local)

Already enabled in `.env.local` - no changes needed!

### For Staging

Update environment variables in your staging deployment:

```bash
# Render.com / Railway / etc.
ENABLE_OPERATOR_PORTAL=true
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=true
```

### For Production

**Keep disabled until feature is fully tested:**

```bash
# Production environment
ENABLE_OPERATOR_PORTAL=false
NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL=false
```

**When ready to launch:**

1. ✅ Complete all testing on staging
2. ✅ Get product owner sign-off
3. ✅ Update production environment variables
4. ✅ Redeploy frontend (Next.js needs rebuild)
5. ✅ Monitor logs and error rates
6. ✅ Test with internal users first

---

## Safety Guarantees

### ✅ What Feature Flags Protect You From

1. **Accidental Merge** - If feature code merges to main, it stays hidden
2. **Database Changes** - Even with new DB fields, features stay disabled
3. **Half-Built Features** - Incomplete features won't show to users
4. **Emergency Rollback** - Just flip flag to false, no code deployment needed

### ⚠️ Important Notes

1. **Frontend Requires Rebuild** - Next.js embeds env vars at build time
2. **Backend Changes Instant** - Just restart server or update env vars
3. **Database Can't Be Disabled** - Once migrated, new fields persist
4. **Test Both States** - Always test with flags ON and OFF

---

## Next Steps

✅ **Feature flags are now set up!**

**Ready to proceed with:**
1. ✅ Database migration (Prisma schema updates)
2. ✅ Backend API implementation
3. ✅ Frontend portal page
4. ✅ Admin configuration UI

**All development will be protected by feature flags! 🛡️**
