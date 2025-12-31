# TransConnect Backend Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TransConnect Backend - Starting" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set location
Set-Location "C:\Users\DELL\mobility-app\transconnect-backend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[!] node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
}

# Kill any existing node processes on port 5000
Write-Host "[+] Checking for existing processes on port 5000..." -ForegroundColor Yellow
$processId = (Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).OwningProcess
if ($processId) {
    Write-Host "[+] Stopping existing process (PID: $processId)..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start the backend
Write-Host ""
Write-Host "[+] Starting TransConnect Backend..." -ForegroundColor Green
Write-Host "[+] Backend will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "[+] Press Ctrl+C to stop" -ForegroundColor Green
Write-Host ""

npm run dev
