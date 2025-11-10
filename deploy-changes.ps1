# Deploy enhanced booking form to production
Write-Host "Deploying enhanced booking form changes..." -ForegroundColor Green

# Add all changes
git add -A

# Commit changes
git commit -m "Enhanced booking form with all stops

- Always show stop selector (removed toggle)
- Support for ALL routes with intelligent fallback stops
- Route-specific configurations:
  * Kampala-Jinja: 5 stops with intermediate towns
  * Kampala-Mbarara: 5 stops with intermediate towns
  * Entebbe-Kampala: 2 stops (origin/destination)
  * Jinja-Kampala: 2 stops (origin/destination)
- Dynamic pricing based on journey segments
- Enhanced route map visualization
- Real-time price calculation with fallback support
- Improved user experience with immediate stop visibility"

# Push to production
Write-Host "Pushing to production..." -ForegroundColor Yellow
git push origin main

Write-Host "Deployment complete! Changes will be live in 1-2 minutes." -ForegroundColor Green
Write-Host "Frontend: https://transconnect.vercel.app" -ForegroundColor Cyan
Write-Host "Backend: https://transconnect-app-44ie.onrender.com" -ForegroundColor Cyan