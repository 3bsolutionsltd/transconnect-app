# Development Workflow - Operator Portal Feature

## 🎯 Goal
Develop the Operator Portal feature in isolation while maintaining the ability to:
1. Ship critical bug fixes to production immediately
2. Keep the feature hidden until fully tested
3. Avoid merge conflicts and deployment issues

---

## 🌳 Git Branching Strategy

### Branch Structure

```
main (production)
  │
  ├── hotfix/* (production bug fixes)
  │
  ├── develop (integration branch)
  │     │
  │     └── feature/operator-portal (your feature branch)
  │           │
  │           ├── feature/operator-portal-backend
  │           ├── feature/operator-portal-frontend
  │           └── feature/operator-portal-admin-ui
```

### Branch Purposes

| Branch | Purpose | Deploys To | Protected |
|--------|---------|------------|-----------|
| `main` | Production code | Production | ✅ Yes |
| `develop` | Integration/staging | Staging | ✅ Yes |
| `hotfix/*` | Emergency fixes | Production (after merge) | ❌ No |
| `feature/operator-portal` | Operator portal development | Dev environment | ❌ No |

---

## 📋 Step-by-Step Workflow

### Initial Setup (Do This First)

#### 1. Create Feature Branch

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create develop branch if it doesn't exist
git checkout -b develop
git push -u origin develop

# Create feature branch from develop
git checkout -b feature/operator-portal
git push -u origin feature/operator-portal
```

#### 2. Protect Main Branch

On GitHub (Settings → Branches → Branch protection rules):
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date before merging
- ✅ Include administrators (optional but recommended)

#### 3. Set Up Environments

Create three deployment environments:

```
Production  → main branch          → api.transconnect.app, transconnect.app
Staging     → develop branch       → api-staging.transconnect.app, staging.transconnect.app
Development → feature/* branches   → api-dev.transconnect.app, dev.transconnect.app
```

---

## 🔧 Development Workflow (Feature Development)

### Day-to-Day Development

```bash
# Always work on feature branch
git checkout feature/operator-portal

# Make your changes
# Edit files...

# Commit frequently
git add .
git commit -m "feat: add operator portal slug field to database"

# Push to feature branch
git push origin feature/operator-portal
```

### Breaking Down Into Sub-Features (Optional)

For large features, create sub-branches:

```bash
# Backend work
git checkout -b feature/operator-portal-backend feature/operator-portal
# ... make changes ...
git commit -m "feat: add operator portal API endpoints"
git push origin feature/operator-portal-backend

# Create PR: feature/operator-portal-backend → feature/operator-portal
# After review, merge back to feature/operator-portal

# Frontend work
git checkout -b feature/operator-portal-frontend feature/operator-portal
# ... make changes ...
git commit -m "feat: create operator portal page component"
git push origin feature/operator-portal-frontend

# Create PR: feature/operator-portal-frontend → feature/operator-portal
```

---

## 🚨 Hotfix Workflow (Production Bug Fixes)

### When a Critical Bug is Found in Production

```bash
# Create hotfix branch from main (production)
git checkout main
git pull origin main
git checkout -b hotfix/fix-payment-gateway-error

# Fix the bug
# Edit files...

# Test thoroughly
npm test

# Commit
git commit -m "fix: resolve payment gateway timeout issue"

# Push
git push origin hotfix/fix-payment-gateway-error
```

### Deploy Hotfix to Production

```bash
# Create PR: hotfix/fix-payment-gateway-error → main
# Get it reviewed and approved
# Merge to main
# Deploy main to production

# IMPORTANT: Merge hotfix back to develop AND your feature branch
git checkout develop
git merge hotfix/fix-payment-gateway-error
git push origin develop

git checkout feature/operator-portal
git merge develop  # This brings in the hotfix
git push origin feature/operator-portal
```

---

## 🎨 Feature Flag Approach (Recommended)

### Why Feature Flags?

Even if code gets merged to production, features can be hidden behind flags:

```typescript
// Example feature flag
const FEATURE_FLAGS = {
  OPERATOR_PORTAL_ENABLED: process.env.ENABLE_OPERATOR_PORTAL === 'true',
  PORTAL_CONFIG_UI_ENABLED: process.env.ENABLE_PORTAL_CONFIG === 'true'
};

// In your code
if (FEATURE_FLAGS.OPERATOR_PORTAL_ENABLED) {
  // Show operator portal
}
```

### Implementation

#### Backend (.env)

```env
# Production (.env.production)
ENABLE_OPERATOR_PORTAL=false
ENABLE_PORTAL_CONFIG=false

# Staging (.env.staging)
ENABLE_OPERATOR_PORTAL=true
ENABLE_PORTAL_CONFIG=true

# Development (.env.development)
ENABLE_OPERATOR_PORTAL=true
ENABLE_PORTAL_CONFIG=true
```

#### Backend API Routes

```typescript
// transconnect-backend/src/routes/operator-portal.ts

import { Router } from 'express';
import { isFeatureEnabled } from '../utils/feature-flags';

const router = Router();

// Feature flag middleware
router.use((req, res, next) => {
  if (!isFeatureEnabled('OPERATOR_PORTAL')) {
    return res.status(404).json({ error: 'Feature not available' });
  }
  next();
});

// Your routes...
router.get('/slug/:slug', async (req, res) => {
  // Portal logic
});

export default router;
```

#### Frontend Navigation (Admin Dashboard)

```typescript
// transconnect-admin/src/components/operator/OperatorLayout.tsx

const FEATURE_FLAGS = {
  PORTAL_CONFIG: process.env.REACT_APP_ENABLE_PORTAL_CONFIG === 'true'
};

const operatorNavigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Routes', href: '/routes', icon: MapPin },
  // Only show if feature enabled
  ...(FEATURE_FLAGS.PORTAL_CONFIG ? [
    { name: 'My Portal', href: '/portal', icon: Globe }
  ] : [])
];
```

#### Frontend Page Access

```typescript
// transconnect-web/src/app/operator/[slug]/page.tsx

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorPortalPage() {
  const router = useRouter();
  const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL === 'true';

  useEffect(() => {
    if (!featureEnabled) {
      router.push('/');
    }
  }, [featureEnabled, router]);

  if (!featureEnabled) {
    return null;
  }

  // Rest of your component
}
```

---

## 📦 Database Migration Strategy

### Problem: How to deploy DB changes without breaking production?

### Solution: Progressive Migration

#### Step 1: Additive Changes Only (Safe)

```prisma
// ✅ SAFE: Adding optional fields
model Operator {
  // ... existing fields ...
  
  slug           String?  @unique  // Optional - won't break existing code
  brandLogoUrl   String?
  brandColor     String?
  tagline        String?
  description    String?
  portalEnabled  Boolean  @default(false)
}
```

#### Step 2: Deploy Migration to Production

```bash
# This is safe because:
# - All new fields are optional
# - Defaults are provided
# - Existing queries still work
npx prisma migrate deploy
```

#### Step 3: Feature Development

Develop feature using new fields, but keep it behind feature flags.

#### Step 4: Data Backfill (If Needed)

```sql
-- After feature is ready, backfill data
UPDATE operators 
SET portal_enabled = false 
WHERE portal_enabled IS NULL;
```

### ⚠️ Never Do This in Active Development

```prisma
// ❌ DANGEROUS: Removing fields
model Operator {
  // Removed: license field - this will break production!
}

// ❌ DANGEROUS: Making optional fields required
model Operator {
  slug String @unique  // Changed from String? - breaks production!
}

// ❌ DANGEROUS: Renaming fields
model Operator {
  company_slug String  // Renamed from 'slug' - breaks production!
}
```

---

## 🚀 Deployment Strategy

### Three-Stage Deployment

```
Development (dev.transconnect.app)
    ↓ (PR review, tests pass)
Staging (staging.transconnect.app)
    ↓ (QA testing, feature sign-off)
Production (transconnect.app)
```

### Development Environment

**What:** Feature branch testing
**When:** Every push to feature/operator-portal
**Who:** Developers only

```bash
# Auto-deploy on push (GitHub Actions)
# or manual:
git push origin feature/operator-portal
# Trigger dev deployment
```

### Staging Environment

**What:** Integration testing with all features
**When:** After PR to develop is merged
**Who:** QA team, stakeholders

```bash
# Merge feature to develop
git checkout develop
git merge feature/operator-portal
git push origin develop
# Staging auto-deploys
```

### Production Environment

**What:** Live system
**When:** After full testing and sign-off
**Who:** End users

```bash
# Create release PR: develop → main
# After approval and tests:
git checkout main
git merge develop
git tag v1.5.0-operator-portal
git push origin main --tags
# Production deploys (with feature flags OFF initially)
```

---

## 📝 Pull Request Workflow

### PR Structure

```
feature/operator-portal-backend
    ↓ PR #123
feature/operator-portal
    ↓ PR #124
develop
    ↓ PR #125 (when ready)
main
```

### PR Templates

#### For Sub-Features → Feature Branch

```markdown
## Description
Backend API endpoints for operator portal

## Changes
- Added `operator-portal.ts` routes
- Added feature flag middleware
- Updated Prisma schema

## Testing
- [ ] Unit tests pass
- [ ] API endpoints tested in Postman
- [ ] Feature flag works correctly

## Checklist
- [ ] Code follows style guidelines
- [ ] No hardcoded values
- [ ] Environment variables documented
- [ ] Feature is behind feature flag
```

#### For Feature → Develop

```markdown
## Description
Complete operator portal feature (Phase 1 MVP)

## Changes
- Database schema updates (additive only)
- Backend API for operator portals
- Frontend operator portal page
- Admin dashboard configuration UI

## Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Staging deployment successful
- [ ] Feature flag tested (on/off)

## Sign-off Required
- [ ] Product Owner approval
- [ ] QA sign-off
- [ ] Security review (if needed)

## Deployment Notes
- Feature is behind `ENABLE_OPERATOR_PORTAL` flag
- Database migration is additive and safe
- No breaking changes to existing functionality
```

---

## 🔄 Keeping Feature Branch Updated

### Regular Sync (Weekly)

```bash
# Update your feature branch with latest from develop
git checkout feature/operator-portal
git fetch origin
git merge origin/develop

# Resolve any conflicts
# Test everything still works
git push origin feature/operator-portal
```

### After Hotfix is Deployed

```bash
# Immediately sync after hotfix merges to main
git checkout main
git pull origin main

git checkout develop
git merge main
git push origin develop

git checkout feature/operator-portal
git merge develop
# Fix conflicts if any
git push origin feature/operator-portal
```

---

## 🧪 Testing Environments

### Environment Configuration Files

```
transconnect-backend/
  .env.development       # Dev environment
  .env.staging          # Staging environment
  .env.production       # Production environment
  
transconnect-web/
  .env.local            # Local development
  .env.staging          # Staging build
  .env.production       # Production build
```

### Feature Flag Configuration

| Environment | Feature Enabled? | Database | Purpose |
|-------------|------------------|----------|---------|
| Development | ✅ Yes | dev_db | Feature development |
| Staging | ✅ Yes | staging_db | QA testing |
| Production | ❌ No (initially) | prod_db | Live system |

---

## 📊 Deployment Checklist

### Before Merging Feature to Develop

- [ ] All sub-features merged to feature branch
- [ ] All tests passing
- [ ] Feature flag properly implemented
- [ ] Database migrations are additive only
- [ ] No breaking changes to existing code
- [ ] Documentation updated
- [ ] Code reviewed by team

### Before Merging Develop to Main

- [ ] Full QA testing completed on staging
- [ ] Performance testing done
- [ ] Security review passed
- [ ] Product owner sign-off
- [ ] Rollback plan documented
- [ ] Feature flags configured correctly
- [ ] Monitoring/alerts set up

### Production Deployment Day

- [ ] Announce maintenance window (if needed)
- [ ] Backup production database
- [ ] Deploy database migrations
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Verify health checks pass
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Keep feature flag OFF initially
- [ ] Test with internal users first
- [ ] Gradually enable for all operators

---

## 🆘 Emergency Rollback Plan

### If Something Goes Wrong in Production

#### Option 1: Disable Feature Flag

```bash
# Fastest option - just disable the feature
# In production server:
export ENABLE_OPERATOR_PORTAL=false
# Restart application
pm2 restart all
# or
systemctl restart transconnect-backend
```

#### Option 2: Revert Deployment

```bash
# Revert to previous version
git checkout main
git revert HEAD  # Or specific commit
git push origin main
# Trigger production deployment
```

#### Option 3: Hotfix

```bash
# Quick fix if issue is minor
git checkout -b hotfix/fix-operator-portal-issue
# Fix the bug
git commit -m "fix: resolve operator portal issue"
# Deploy immediately
```

---

## 📁 Recommended File Structure for Feature Flags

### Create Feature Flag Utility

**File:** `transconnect-backend/src/utils/feature-flags.ts` (NEW)

```typescript
export const FEATURE_FLAGS = {
  OPERATOR_PORTAL: process.env.ENABLE_OPERATOR_PORTAL === 'true',
  PORTAL_CONFIG_UI: process.env.ENABLE_PORTAL_CONFIG === 'true',
  PORTAL_ANALYTICS: process.env.ENABLE_PORTAL_ANALYTICS === 'true',
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true;
}

// Middleware for Express routes
export function requireFeature(feature: keyof typeof FEATURE_FLAGS) {
  return (req: any, res: any, next: any) => {
    if (!isFeatureEnabled(feature)) {
      return res.status(404).json({ 
        error: 'Feature not available',
        feature 
      });
    }
    next();
  };
}
```

**Usage:**

```typescript
import { requireFeature } from '../utils/feature-flags';

// In your route file
router.use(requireFeature('OPERATOR_PORTAL'));
```

---

## 🎯 Summary: Your Action Plan

### Week 1: Setup

1. ✅ Create `develop` branch
2. ✅ Create `feature/operator-portal` branch
3. ✅ Set up feature flags
4. ✅ Configure branch protection
5. ✅ Set up dev environment

### Weeks 2-3: Development

1. ✅ Work on `feature/operator-portal` branch
2. ✅ Commit frequently
3. ✅ Keep all features behind flags
4. ✅ Sync with develop weekly
5. ✅ Handle hotfixes via separate branches

### Week 4: Testing

1. ✅ Merge to `develop`
2. ✅ Deploy to staging
3. ✅ Full QA testing
4. ✅ Bug fixes on feature branch
5. ✅ Final sign-off

### Week 5: Production Release

1. ✅ Merge `develop` to `main`
2. ✅ Deploy to production (flags OFF)
3. ✅ Test internally
4. ✅ Enable feature gradually
5. ✅ Monitor and fix issues

---

## 🔗 Quick Commands Reference

```bash
# Start feature development
git checkout -b feature/operator-portal develop

# Daily work
git add .
git commit -m "feat: description"
git push origin feature/operator-portal

# Sync with develop
git fetch origin
git merge origin/develop

# Create hotfix
git checkout -b hotfix/fix-name main
# ... fix ...
git push origin hotfix/fix-name
# PR to main, then merge back to develop and feature branch

# When feature is ready
# PR: feature/operator-portal → develop
# Test on staging
# PR: develop → main
# Deploy to production with flags OFF
```

---

**This workflow ensures:**
- ✅ Feature development isolated from production
- ✅ Critical bugs can be fixed immediately
- ✅ No accidental production deployments
- ✅ Safe database migrations
- ✅ Controlled feature rollout

Ready to start? Create your branches and let's begin! 🚀
