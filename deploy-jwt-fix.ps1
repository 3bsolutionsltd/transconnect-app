#!/usr/bin/env pwsh
# JWT Token Refresh Fix - Quick Deployment Script
# Run this to deploy the token refresh fix to production

Write-Host "🔧 TransConnect - JWT Token Refresh Fix Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "transconnect-backend")) {
    Write-Host "❌ Error: transconnect-backend directory not found" -ForegroundColor Red
    Write-Host "   Please run this script from the mobility-app directory" -ForegroundColor Yellow
    exit 1
}

# Step 1: Build backend
Write-Host "📦 Step 1: Building backend..." -ForegroundColor Yellow
Set-Location transconnect-backend

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install
}

Write-Host "   Compiling TypeScript..." -ForegroundColor Gray
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

# Step 2: Git operations
Set-Location ..
Write-Host "📤 Step 2: Committing changes..." -ForegroundColor Yellow

git add transconnect-backend/src/routes/auth.ts
git add transconnect-backend/.env
git add transconnect-backend/.env.example
git add JWT_TOKEN_REFRESH_FIX.md
git add deploy-jwt-fix.ps1

$commitMessage = "fix: Implement JWT token refresh system with 30-day expiry

- Extended token lifetime from 7 days to 30 days
- Added /api/auth/refresh endpoint for seamless token renewal
- Enhanced login/register responses with expiry info
- Improved error messages for expired tokens
- Fixes production 401 errors (TokenExpiredError)

Resolves: Production booking failures due to expired tokens
Impact: Users can now stay logged in for 30 days
"

git commit -m $commitMessage

Write-Host "✅ Changes committed" -ForegroundColor Green
Write-Host ""

# Step 3: Push to GitHub
Write-Host "🚀 Step 3: Deploying to production..." -ForegroundColor Yellow
Write-Host "   Pushing to GitHub (triggers Render auto-deploy)..." -ForegroundColor Gray

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git push failed!" -ForegroundColor Red
    Write-Host "   Please check your Git credentials and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Code pushed to GitHub" -ForegroundColor Green
Write-Host ""

# Step 4: Instructions for environment variables
Write-Host "⚙️  Step 4: Update Render Environment Variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "ACTION REQUIRED:" -ForegroundColor Red
Write-Host "1. Go to: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Select your TransConnect Backend service" -ForegroundColor White
Write-Host "3. Go to: Environment → Environment Variables" -ForegroundColor White
Write-Host "4. Update or add this variable:" -ForegroundColor White
Write-Host ""
Write-Host "   JWT_EXPIRES_IN=30d" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Click 'Save Changes'" -ForegroundColor White
Write-Host "6. Render will auto-redeploy with new settings" -ForegroundColor White
Write-Host ""

# Step 5: Testing
Write-Host "🧪 Step 5: Testing Endpoints" -ForegroundColor Yellow
Write-Host ""
Write-Host "Wait 2-3 minutes for Render deployment, then test:" -ForegroundColor Gray
Write-Host ""
Write-Host "# Test token refresh:" -ForegroundColor White
Write-Host 'curl -X POST https://api.transconnect.app/api/auth/refresh \' -ForegroundColor Cyan
Write-Host '  -H "Authorization: Bearer <your_token>" \' -ForegroundColor Cyan
Write-Host '  -H "Content-Type: application/json"' -ForegroundColor Cyan
Write-Host ""
Write-Host "# Test login (should return expiresAt):" -ForegroundColor White
Write-Host 'curl -X POST https://api.transconnect.app/api/auth/login \' -ForegroundColor Cyan
Write-Host '  -H "Content-Type: application/json" \' -ForegroundColor Cyan
Write-Host '  -d ''{"email":"test@example.com","password":"password"}''' -ForegroundColor Cyan
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Deployment Steps Completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Yellow
Write-Host "  ✓ Extended token lifetime: 7 days → 30 days" -ForegroundColor Green
Write-Host "  ✓ Added token refresh endpoint" -ForegroundColor Green
Write-Host "  ✓ Enhanced error messages" -ForegroundColor Green
Write-Host "  ✓ Fixes production 401 booking errors" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update JWT_EXPIRES_IN=30d on Render" -ForegroundColor White
Write-Host "  2. Wait for auto-deployment (2-3 minutes)" -ForegroundColor White
Write-Host "  3. Test the /api/auth/refresh endpoint" -ForegroundColor White
Write-Host "  4. Monitor production logs for errors" -ForegroundColor White
Write-Host "  5. Update mobile app to use token refresh" -ForegroundColor White
Write-Host ""
Write-Host "📖 See JWT_TOKEN_REFRESH_FIX.md for detailed documentation" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Happy deploying!" -ForegroundColor Green
