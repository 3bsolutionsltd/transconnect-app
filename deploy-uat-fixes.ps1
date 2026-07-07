# Quick Deployment Script for TC010-TC013 Fixes
# Run this after reviewing the code changes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TransConnect UAT Fixes Deployment" -ForegroundColor Cyan
Write-Host "TC010-TC013 Fixes" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "transconnect-backend") -or -not (Test-Path "transconnect-web")) {
    Write-Host "ERROR: This script must be run from the mobility-app root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# Backend deployment
Write-Host "[1/3] Deploying Backend Changes..." -ForegroundColor Green
Write-Host "  - Modified: transconnect-backend/src/routes/bookings.ts" -ForegroundColor Gray
Write-Host ""

$deployBackend = Read-Host "Deploy backend changes? (y/n)"
if ($deployBackend -eq 'y') {
    Push-Location transconnect-backend
    
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "  Building TypeScript..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "  Backend ready for deployment!" -ForegroundColor Green
    Write-Host "  Run: pm2 restart transconnect-backend" -ForegroundColor Cyan
    Write-Host ""
    
    Pop-Location
} else {
    Write-Host "  Skipped backend deployment" -ForegroundColor Yellow
    Write-Host ""
}

# Frontend deployment
Write-Host "[2/3] Deploying Frontend Changes..." -ForegroundColor Green
Write-Host "  - Modified: transconnect-web/src/app/booking-success/page.tsx" -ForegroundColor Gray
Write-Host "  - Modified: transconnect-web/src/app/bookings/page.tsx" -ForegroundColor Gray
Write-Host ""

$deployFrontend = Read-Host "Deploy frontend changes? (y/n)"
if ($deployFrontend -eq 'y') {
    Push-Location transconnect-web
    
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "  Building Next.js application..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "  Frontend build complete!" -ForegroundColor Green
    Write-Host "  Deploy the .next and public folders to your hosting" -ForegroundColor Cyan
    Write-Host ""
    
    Pop-Location
} else {
    Write-Host "  Skipped frontend deployment" -ForegroundColor Yellow
    Write-Host ""
}

# Summary
Write-Host "[3/3] Deployment Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Fixes Applied:" -ForegroundColor White
Write-Host "  ✅ TC010: Expired booking cancellation now allowed" -ForegroundColor Green
Write-Host "  ✅ TC011: Download ticket button improved" -ForegroundColor Green
Write-Host "  ✅ TC012: Transfer request page (needs build deploy)" -ForegroundColor Green
Write-Host "  ✅ TC013: iOS-compatible QR download added" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy backend to production server" -ForegroundColor White
Write-Host "  2. Deploy frontend build to hosting" -ForegroundColor White
Write-Host "  3. Test each UAT case:" -ForegroundColor White
Write-Host "     - TC010: Cancel expired booking" -ForegroundColor Gray
Write-Host "     - TC011: Download ticket (cash payment)" -ForegroundColor Gray
Write-Host "     - TC012: Click 'Request Transfer' link" -ForegroundColor Gray
Write-Host "     - TC013: Download QR on iOS device" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  See TC010-TC013_FIXES_SUMMARY.md for detailed changes" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Optional: Git commit
Write-Host ""
$commit = Read-Host "Create git commit for these changes? (y/n)"
if ($commit -eq 'y') {
    git add transconnect-backend/src/routes/bookings.ts
    git add transconnect-web/src/app/booking-success/page.tsx
    git add transconnect-web/src/app/bookings/page.tsx
    git add TC010-TC013_FIXES_SUMMARY.md
    git add deploy-uat-fixes.ps1
    
    git commit -m "Fix UAT test cases TC010-TC013

- TC010: Allow cancellation of expired bookings
- TC011: Improve ticket download mechanism with better error handling
- TC012: Verify transfer request page routing (needs rebuild)
- TC013: Add iOS-compatible QR code download

Changes:
- Backend: Modified cancellation logic to allow expired booking cancellation
- Frontend: Enhanced download mechanism with iOS support and error handling
- Documentation: Added comprehensive fix summary

Deployment required: Backend restart + Frontend rebuild"
    
    Write-Host "✅ Git commit created" -ForegroundColor Green
    Write-Host "   Run 'git push' to push changes" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green
