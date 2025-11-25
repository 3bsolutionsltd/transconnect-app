# TransConnect Services Startup Script
# Run this in an external PowerShell terminal (outside VS Code)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   TRANSCONNECT SERVICES STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Set the base directory
$baseDir = "C:\Users\DELL\mobility-app"
Set-Location $baseDir

Write-Host "📍 Base Directory: $baseDir" -ForegroundColor Yellow
Write-Host ""

# Function to start service in new window
function Start-ServiceWindow {
    param(
        [string]$WindowTitle,
        [string]$Directory,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "🚀 Starting $WindowTitle..." -ForegroundColor Green
    
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "powershell.exe"
    $startInfo.Arguments = "-NoExit -Command `"cd '$Directory'; Write-Host 'Starting $WindowTitle on port $Port...' -ForegroundColor Green; $Command`""
    $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal
    $startInfo.CreateNoWindow = $false
    
    $process = [System.Diagnostics.Process]::Start($startInfo)
    Start-Sleep -Seconds 2
    
    return $process
}

# Kill existing processes
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*ts-node*" -or $_.ProcessName -like "*npm*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Start Backend API (Port 5000)
Write-Host "1️⃣ Starting Backend API (Port 5000)..." -ForegroundColor Cyan
$backendDir = Join-Path $baseDir "transconnect-backend"
$backendProcess = Start-ServiceWindow -WindowTitle "TransConnect Backend API" -Directory $backendDir -Command "npm run dev" -Port 5000

# Wait for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test backend
Write-Host "🔍 Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5
    Write-Host "✅ Backend API: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend API: Not responding yet" -ForegroundColor Red
}
Write-Host ""

# Start Agent Frontend (Port 3002)
Write-Host "2️⃣ Starting Agent Frontend (Port 3002)..." -ForegroundColor Cyan
$agentDir = Join-Path $baseDir "transconnect-web"
$agentProcess = Start-ServiceWindow -WindowTitle "TransConnect Agent Frontend" -Directory $agentDir -Command "npm run dev -- --port 3002" -Port 3002

# Wait for agent frontend
Write-Host "⏳ Waiting for agent frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test agent frontend
Write-Host "🔍 Testing agent frontend..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing | Out-Null
    Write-Host "✅ Agent Frontend: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Agent Frontend: Not responding yet" -ForegroundColor Red
}
Write-Host ""

# Start Admin Panel (Port 3003)
Write-Host "3️⃣ Starting Admin Panel (Port 3003)..." -ForegroundColor Cyan
$adminDir = Join-Path $baseDir "transconnect-admin"
$adminProcess = Start-ServiceWindow -WindowTitle "TransConnect Admin Panel" -Directory $adminDir -Command "npm start" -Port 3003

# Wait for admin panel
Write-Host "⏳ Waiting for admin panel to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Test admin panel
Write-Host "🔍 Testing admin panel..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "http://localhost:3003" -TimeoutSec 5 -UseBasicParsing | Out-Null
    Write-Host "✅ Admin Panel: Running" -ForegroundColor Green
} catch {
    Write-Host "❌ Admin Panel: Not responding yet" -ForegroundColor Red
}
Write-Host ""

# Final status check
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       TRANSCONNECT SERVICES STATUS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Yellow
Write-Host "   • Backend API:    http://localhost:5000" -ForegroundColor White
Write-Host "   • Agent Frontend: http://localhost:3002" -ForegroundColor White  
Write-Host "   • Admin Panel:    http://localhost:3003" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Test Endpoints:" -ForegroundColor Yellow
Write-Host "   • Backend Health:  http://localhost:5000/health" -ForegroundColor White
Write-Host "   • Agent Login:     http://localhost:3002/agents/login" -ForegroundColor White
Write-Host "   • Admin Login:     http://localhost:3003" -ForegroundColor White
Write-Host ""

Write-Host "📝 Test Credentials:" -ForegroundColor Yellow
Write-Host "   • Admin: admin@transconnect.ug / admin123" -ForegroundColor White
Write-Host "   • Agent: Use phone +256701234567 for testing" -ForegroundColor White
Write-Host ""

Write-Host "✅ All services started! Check individual windows for logs." -ForegroundColor Green
Write-Host "Press any key to exit this script (services will continue running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")