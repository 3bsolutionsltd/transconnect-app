# Staging to Production Workflow

## Branch Strategy

### Staging Branch (`staging`)
- **Purpose**: Testing and development environment
- **Deployment**: Auto-deploys to https://transconnect-app-testing.onrender.com
- **Use Case**: Test new features, bug fixes, and enhancements before production
- **Database**: Staging database with test data
- **Cost**: $7/month (FREE backend + Starter database)

### Production Branch (`main`)
- **Purpose**: Live production environment
- **Deployment**: Auto-deploys to https://transconnect-app-44ie.onrender.com
- **Use Case**: Stable, tested code serving real users
- **Database**: Production database with real user data
- **Protection**: Only accepts tested code from staging

## Development Workflow

### 1. Work on Staging
```bash
# Always work on staging branch
git checkout staging

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to staging
git push origin staging
```

### 2. Test on Staging Environment
- Wait for auto-deployment (5-10 minutes)
- Visit: https://transconnect-app-testing.onrender.com
- Test all new features thoroughly
- Verify API endpoints work correctly
- Check database changes are correct
- Test with mobile app (staging profile)

### 3. When Staging is Validated ✅
Only after thorough testing:
```bash
# Switch to main
git checkout main

# Merge staging (creates merge commit)
git merge staging

# Push to production
git push origin main
```

### 4. Monitor Production Deployment
- Watch Render deployment logs
- Test critical endpoints on production
- Have rollback plan ready if issues arise

## Current State

### Branches
- ✅ `staging` - Contains segment API + staging setup (commits: 8fa0881, 2ec8826, 5891f22, 4be98be, 6391a57)
- ✅ `main` - Stable production code (commit: 2ec8826)

### What's Only in Staging Now
The staging branch has these additional features being tested:
1. **Route Segments API** (commit 6391a57)
   - Database schema: `RouteSegment` model
   - Search endpoint: `/api/routes/search-segments`
   - CRUD endpoints for segment management
   - Date-based pricing variations
   - Role-based authorization

2. **Your Changes** (commit 8fa0881)
   - Latest updates to segment implementation

### What's in Production (main)
- All stable features up to staging setup documentation
- Does NOT include segment API yet
- Users continue using legacy route search

## Testing Checklist (Before Production)

Before merging staging to main, verify:

### Backend Tests
- [ ] Health endpoint responds: `curl https://transconnect-app-testing.onrender.com/api/health`
- [ ] Segment search works: `curl "https://transconnect-app-testing.onrender.com/api/routes/search-segments?origin=Kampala&destination=Mbarara"`
- [ ] Legacy routes still work: `curl https://transconnect-app-testing.onrender.com/api/routes`
- [ ] Admin can create segments: Test via Postman/Thunder Client
- [ ] Operators can view their segments: Test role-based access
- [ ] Date-based pricing calculates correctly: Test weekend/holiday rates

### Database Tests
- [ ] Migrations run successfully
- [ ] Test data seeds correctly
- [ ] Segment queries perform well (check indexes)
- [ ] No data loss in legacy route searches

### Integration Tests
- [ ] Mobile app (staging profile) can search segments
- [ ] Admin dashboard can manage segments (when deployed)
- [ ] Booking flow works with segment-based routes
- [ ] Payment integration unaffected

### Performance Tests
- [ ] Response times acceptable (<500ms for searches)
- [ ] Database query performance optimized
- [ ] No memory leaks in long-running processes

### Security Tests
- [ ] Role-based access enforced (ADMIN/OPERATOR/PASSENGER)
- [ ] JWT authentication working
- [ ] No sensitive data exposed in API responses

## Rollback Plan

If production issues arise after deployment:

```bash
# On main branch
git checkout main

# Revert to previous stable commit
git reset --hard <previous-commit-hash>

# Force push to trigger production rollback
git push origin main --force
```

**Previous stable commit**: `2ec8826`

## Render Configuration

### Staging Service (transconnect-app-testing)
- **Branch**: `staging` ✅
- **Auto-Deploy**: Enabled
- **Database**: Starter PostgreSQL ($7/month)
- **Backend**: FREE tier ($0/month)
- **Environment**: STAGING

### Production Service (transconnect-app-44ie)
- **Branch**: `main` ✅
- **Auto-Deploy**: Enabled
- **Database**: Production PostgreSQL
- **Backend**: Current tier
- **Environment**: PRODUCTION

## Best Practices

### ✅ DO
- Always develop on `staging` branch
- Test thoroughly on staging environment before production
- Keep staging and production configurations separate
- Document all changes in commit messages
- Run tests before merging to main
- Monitor production after deployment

### ❌ DON'T
- Never commit directly to `main` branch
- Don't merge to production without testing
- Don't push untested code to staging
- Don't use production database for testing
- Don't force push to main unless rolling back

## Next Steps

1. **Continue Development on Staging** ✅ (Current)
   - Branch: `staging`
   - Test segment API endpoints
   - Build admin UI for segment management
   - Test mobile app with staging profile

2. **Validate Everything Works**
   - Run through testing checklist above
   - Fix any bugs found during testing
   - Get team approval for production release

3. **Promote to Production**
   - Follow workflow step 3 above
   - Merge staging → main
   - Monitor production deployment
   - Verify with real users

## Questions?

This workflow ensures:
- ✅ Staging environment for safe testing
- ✅ Production stability (no untested code)
- ✅ Clear promotion path (staging → production)
- ✅ Easy rollback if issues arise
- ✅ Separation of test and real data
- ✅ Cost-effective testing environment ($7/month)
