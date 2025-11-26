# Environment Switcher for TransConnect Frontend (PowerShell)
# Usage: .\switch-env.ps1 [development|mobile|production]

param(
    [string]$EnvType = "development"
)

Write-Host "🔄 Switching to $EnvType environment..." -ForegroundColor Cyan

switch ($EnvType) {
    "development" {
        Copy-Item ".env.local.development" ".env.local" -Force
        Write-Host "✅ Switched to localhost development environment" -ForegroundColor Green
        Write-Host "   Frontend: http://localhost:3002" -ForegroundColor White
        Write-Host "   Backend: http://localhost:5000" -ForegroundColor White
    }
    "mobile" {
        Copy-Item ".env.local.mobile" ".env.local" -Force
        Write-Host "✅ Switched to mobile testing environment" -ForegroundColor Green
        Write-Host "   Frontend: http://192.168.1.2:3002" -ForegroundColor White
        Write-Host "   Backend: http://192.168.1.2:5000" -ForegroundColor White
    }
    "production" {
        Copy-Item ".env.local.production" ".env.local" -Force
        Write-Host "✅ Switched to production environment" -ForegroundColor Green
        Write-Host "   ⚠️  Update URLs in .env.local for your production domain" -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Invalid environment. Use: development, mobile, or production" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Current configuration:" -ForegroundColor Cyan
Get-Content ".env.local" | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
Write-Host ""
Write-Host "🔄 Restart your frontend server to apply changes" -ForegroundColor Yellow