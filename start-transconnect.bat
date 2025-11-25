@echo off
echo ============================================
echo    TRANSCONNECT SERVICES STARTUP SCRIPT
echo ============================================
echo.

cd /d "C:\Users\DELL\mobility-app"
echo Base Directory: %CD%
echo.

echo Cleaning up existing processes...
taskkill /f /im node.exe 2>nul
taskkill /f /im ts-node.exe 2>nul  
taskkill /f /im npm.exe 2>nul
timeout /t 3 /nobreak >nul

echo Starting services...
echo.

echo 1. Starting Backend API (Port 5000)...
start "TransConnect Backend API" cmd /k "cd transconnect-backend && npm run dev"
timeout /t 8 /nobreak >nul

echo 2. Starting Agent Frontend (Port 3002)...  
start "TransConnect Agent Frontend" cmd /k "cd transconnect-web && npm run dev -- --port 3002"
timeout /t 8 /nobreak >nul

echo 3. Starting Admin Panel (Port 3003)...
start "TransConnect Admin Panel" cmd /k "cd transconnect-admin && npm start"
timeout /t 8 /nobreak >nul

echo.
echo ============================================
echo        TRANSCONNECT SERVICES STATUS
echo ============================================
echo.
echo Service URLs:
echo   • Backend API:    http://localhost:5000
echo   • Agent Frontend: http://localhost:3002  
echo   • Admin Panel:    http://localhost:3003
echo.
echo Test Endpoints:
echo   • Backend Health:  http://localhost:5000/health
echo   • Agent Login:     http://localhost:3002/agents/login
echo   • Admin Login:     http://localhost:3003
echo.
echo Test Credentials:
echo   • Admin: admin@transconnect.ug / admin123
echo   • Agent: Use phone +256701234567 for testing
echo.
echo All services started! Check individual windows for logs.
echo Press any key to exit...
pause >nul