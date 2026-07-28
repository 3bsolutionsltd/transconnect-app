# Operator Portal - Git Workflow Quick Reference

## ✅ Branch Setup Complete

Your branches are now configured:

```
feature/operator-portal (YOU ARE HERE) ← Work here for operator portal
    ↓ (merge when ready for testing)
main ← Deploys to STAGING automatically
    ↓ (tag when ready for production)
v1.x.x tag ← Deploys to PRODUCTION
```

---

## 🌳 Current Branch Structure

| Branch | Status | Deploys To | Purpose |
|--------|--------|------------|---------|
| `feature/operator-portal` | ✅ Active | Dev environment | Operator portal development |
| `main` | ✅ Protected | **Staging** (auto-deploy) | Integration & QA testing |
| `v*.*.*` tags on main | ✅ Protected | **Production** (on tag) | Live system |

---

## 📋 Your Daily Workflow

### 1. Development Work (Daily)

```bash
# Make sure you're on the feature branch
git checkout feature/operator-portal

# Pull latest changes
git pull origin feature/operator-portal

# Make your changes...
# Edit files in VS Code

# Stage and commit
git add .
git commit -m "feat: add operator portal database schema"

# Push to remote
git push origin feature/operator-portal
```

### 2. When You Need to Fix Production Bugs

```bash
# Create hotfix from main (since main goes to staging, then tag for prod)
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug

# Fix the bug...
# Test thoroughly

# Commit and push
git add .
git commit -m "fix: resolve payment gateway issue"
git push origin hotfix/fix-critical-bug

# Create PR on GitHub: hotfix/fix-critical-bug → main
# After merge, main will auto-deploy to staging
# Test on staging
# Create tag to deploy to production: git tag v1.5.1 && git push origin v1.5.1

# IMPORTANT: Merge hotfix back to your feature branch
git checkout feature/operator-portal
git merge main  # This brings in the hotfix
git push origin feature/operator-portal
```

### 3. When Operator Portal Feature is Ready for Testing

```bash
# Make sure everything is committed and pushed
git checkout feature/operator-portal
git status  # Should be clean

# Create Pull Request on GitHub:
# feature/operator-portal → main
# This will deploy to STAGING for QA testing
```

### 4. When Ready for Production (After Full Testing)

```bash
# After PR is merged to main and tested on staging
git checkout main
git pull origin main

# Create version tag
git tag v1.5.0
git push origin v1.5.0

# This triggers production deployment!
```

---

## 🚨 Keeping Feature Branch Updated

### Weekly Sync (Recommended)

```bash
# Get latest from main (includes any hotfixes)
git checkout main
git pull origin main

# Merge into your feature branch
git checkout feature/operator-portal
git merge main

# If there are conflicts, resolve them, then:
git add .
git commit -m "chore: merge main into feature branch"
git push origin feature/operator-portal
```

---

## 🛡️ Protection Strategy

### Use Feature Flags (Recommended)

Even after merging to main, keep features hidden:

**Backend (.env files):**

```env
# .env.production (for when it reaches production via tag)
ENABLE_OPERATOR_PORTAL=false

# .env.staging (for main branch)
ENABLE_OPERATOR_PORTAL=true

# .env.development (for feature branch)
ENABLE_OPERATOR_PORTAL=true
```

**In your code:**

```typescript
// Backend route
if (process.env.ENABLE_OPERATOR_PORTAL !== 'true') {
  return res.status(404).json({ error: 'Feature not available' });
}

// Frontend component
const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_OPERATOR_PORTAL === 'true';
if (!featureEnabled) return null;
```

---

## 📊 Git Commands Cheatsheet

```bash
# Check current branch
git branch

# Switch branches
git checkout feature/operator-portal
git checkout main

# See what changed
git status
git diff

# Undo uncommitted changes
git restore <file>
git restore .  # All files

# View commit history
git log --oneline
git log --graph --oneline --all

# Sync with remote
git fetch origin
git pull origin feature/operator-portal

# Force sync (careful!)
git fetch origin
git reset --hard origin/feature/operator-portal
```

---

## 🔄 Deployment Flow Diagram

```
1. LOCAL DEVELOPMENT
   └─→ feature/operator-portal branch
        └─→ git push
             └─→ (No auto-deploy, manual if needed)

2. STAGING TESTING
   └─→ Create PR: feature/operator-portal → main
        └─→ Merge PR
             └─→ main branch
                  └─→ 🚀 AUTO-DEPLOY TO STAGING
                       └─→ Test on staging.transconnect.app

3. PRODUCTION RELEASE
   └─→ git tag v1.5.0
        └─→ git push origin v1.5.0
             └─→ 🚀 AUTO-DEPLOY TO PRODUCTION
                  └─→ Live on transconnect.app
```

---

## ✅ Current Status

- [x] `feature/operator-portal` branch created
- [x] Branch pushed to remote
- [x] Documentation committed to main
- [ ] Feature flag setup (do this next)
- [ ] Start Phase 1 implementation

---

## 🎯 Next Steps

### Immediate (Today)

1. **Set up feature flags** (30 minutes)
   - Create `transconnect-backend/src/utils/feature-flags.ts`
   - Add environment variables to `.env` files
   - Test that flags work correctly

2. **Start Phase 1: Database Migration** (1 hour)
   - Update Prisma schema (add operator portal fields)
   - Create migration: `npx prisma migrate dev --name add_operator_portal_fields`
   - Test migration

### This Week

3. **Backend API** (2-3 days)
   - Create `operator-portal.ts` route file
   - Add feature flag protection
   - Test endpoints

4. **Frontend Portal Page** (2-3 days)
   - Create `operator/[slug]/page.tsx`
   - Add feature flag check
   - Test rendering

### Next Week

5. **Admin Config UI** (1-2 days)
   - Create `OperatorPortalConfig.tsx`
   - Wire up to backend API
   - Test configuration flow

---

## 📞 Quick Help

**Problem:** Accidentally committed to main
```bash
# Undo last commit (keeps changes)
git reset --soft HEAD~1
git checkout feature/operator-portal
git add .
git commit -m "your message"
```

**Problem:** Merge conflicts
```bash
# See conflicted files
git status

# Edit files to resolve conflicts
# Remove <<<<<<, ======, >>>>>> markers

# Mark as resolved
git add <resolved-files>
git commit -m "chore: resolve merge conflicts"
```

**Problem:** Feature branch is behind main
```bash
git checkout feature/operator-portal
git merge main
# Resolve conflicts if any
git push origin feature/operator-portal
```

---

**You're all set!** 🚀 

Current branch: `feature/operator-portal`
Start implementing the operator portal feature now!
