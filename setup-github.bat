@echo off
REM GitHub Repository Connection Script (Windows)
REM Repository: https://github.com/3bsolutionsltd/transconnect-app.git

echo 🔗 Connecting to TransConnect GitHub Repository...
echo ================================================
echo Repository: 3bsolutionsltd/transconnect-app
echo.

set "REPO_URL=https://github.com/3bsolutionsltd/transconnect-app.git"

echo 📡 Adding GitHub remote...
git remote add origin "%REPO_URL%"

if errorlevel 1 (
    echo 🔄 Remote already exists, updating URL...
    git remote set-url origin "%REPO_URL%"
)

echo 🚀 Pushing develop branch...
git push -u origin develop

if errorlevel 1 (
    echo ❌ Error pushing develop branch. Please check repository permissions.
    pause
    exit /b 1
)

echo 🌟 Creating main branch...
git checkout -b main
git push -u origin main

echo 🔄 Switching back to develop...
git checkout develop

echo ✅ GitHub repository setup complete!
echo.
echo 🎉 Your repository is now live!
echo.
echo 🚀 Next Steps:
echo 1. Deploy backend to Render
echo 2. Deploy frontend to Vercel  
echo 3. Configure production environment variables
echo.
echo Happy deploying! 🚀
echo.
echo Press any key to open your GitHub repository...
pause > nul

REM Try to open the repository URL in browser
for /f "delims=" %%i in ('echo %REPO_URL%') do set "WEB_URL=%%i"
set "WEB_URL=%WEB_URL:.git=%"
start "%WEB_URL%"