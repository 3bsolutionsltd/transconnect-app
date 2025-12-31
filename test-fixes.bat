@echo off
echo ========================================
echo   TransConnect - Testing Critical Fixes
echo ========================================
echo.

REM Check if backend is running
echo Step 1: Checking backend status...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Backend is not running!
    echo [+] Starting backend...
    start "TransConnect Backend" cmd /c "cd /d %~dp0transconnect-backend && npm run dev"
    echo [+] Waiting 10 seconds for backend to start...
    timeout /t 10 /nobreak > nul
) else (
    echo [OK] Backend is already running
)

echo.
echo Step 2: Testing backend health...
curl http://localhost:5000/api/health
echo.

echo.
echo ========================================
echo   Manual Testing Instructions
echo ========================================
echo.
echo TEST 1: QR Scanner (Admin Dashboard)
echo   1. Open http://localhost:3001
echo   2. Login as operator
echo   3. Go to QR Scanner page
echo   4. Click "Start Camera"
echo   Expected: Camera stays active (not stops immediately)
echo.
echo TEST 2: Payment Confirmation
echo   1. Mobile app: Create cash payment booking
echo   2. Admin dashboard: Confirm the payment
echo   3. Mobile app: Pull to refresh or wait 30s
echo   Expected: Status changes to CONFIRMED
echo.
echo TEST 3: Notifications
echo   1. Confirm a payment in admin dashboard
echo   2. Check backend console logs
echo   Expected: "Payment confirmation notification sent"
echo.
echo ========================================
echo Press any key to exit...
pause > nul
