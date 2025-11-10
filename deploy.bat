@echo off
echo Deploying enhanced booking form changes...

REM Add all changes including the booking form enhancements
git add .

REM Check if there are changes to commit
git status --porcelain > temp_status.txt
if %errorlevel% equ 0 (
    for /f %%i in (temp_status.txt) do (
        echo Changes found, committing...
        goto commit
    )
    echo No changes to commit
    goto end
)

:commit
git commit -m "Enhanced booking form with all stops - always visible stop selector for all routes with dynamic pricing and intelligent fallback system"

echo Pushing to production...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo =====================================================
    echo Deployment SUCCESS! Changes pushed to production
    echo =====================================================
    echo Frontend will be live at: https://transconnect.vercel.app
    echo Backend API: https://transconnect-app-44ie.onrender.com
    echo.
    echo Changes include:
    echo - Always visible stop selector for all routes
    echo - Enhanced stop generation for Kampala-Jinja, Kampala-Mbarara, Entebbe-Kampala, Jinja-Kampala
    echo - Dynamic pricing based on journey segments
    echo - Improved route map visualization
    echo - Real-time price calculation with offline fallback
    echo.
) else (
    echo Push failed with error code: %errorlevel%
    echo Please check your internet connection and try again
)

:end
del temp_status.txt 2>nul
pause