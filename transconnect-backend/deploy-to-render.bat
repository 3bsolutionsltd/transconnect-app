@echo off
REM TransConnect Backend Deployment to Render (Windows)

echo 🚀 Starting TransConnect Backend Deployment to Render...
echo ================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the transconnect-backend directory.
    pause
    exit /b 1
)

echo 📋 Pre-deployment Checklist:
echo 1. ✅ TypeScript compilation check...

REM Build the project to ensure everything compiles
call npm run build
if errorlevel 1 (
    echo ❌ Build failed! Please fix compilation errors before deploying.
    pause
    exit /b 1
)

echo 2. ✅ Build successful!

echo 3. 📦 Checking required files...
set required_files=render.yaml package.json tsconfig.json prisma\schema.prisma

for %%f in (%required_files%) do (
    if not exist "%%f" (
        echo ❌ Missing required file: %%f
        pause
        exit /b 1
    )
    echo    ✅ Found: %%f
)

echo 4. 🔍 Validating environment configuration...

REM Check if .env.production exists as a template
if not exist ".env.production" (
    echo ⚠️  Warning: .env.production template not found
    echo    You'll need to configure environment variables in Render dashboard
) else (
    echo    ✅ Production environment template ready
)

echo.
echo 🌟 Ready for Render Deployment!
echo ================================================
echo.
echo 📌 Next Steps:
echo 1. 🌐 Go to https://render.com and sign up/login
echo 2. 📁 Connect your GitHub repository
echo 3. 🚀 Create a new Web Service
echo 4. ⚙️  Configure the following:
echo.
echo    Repository: YOUR_GITHUB_USERNAME/transconnect-mvp1
echo    Branch: main
echo    Root Directory: transconnect-backend
echo    Environment: Node
echo    Build Command: npm install ^&^& npm run build
echo    Start Command: npm start
echo    Auto-Deploy: Yes
echo.
echo 5. 🔧 Add Environment Variables:
echo    NODE_ENV=production
echo    PORT=3000
echo    JWT_SECRET=[generate-random-32-char-string]
echo    JWT_REFRESH_SECRET=[generate-random-32-char-string]
echo    ENCRYPTION_KEY=[generate-random-32-char-string]
echo    DATABASE_URL=[will-be-provided-by-render-database]
echo.
echo 6. 🗄️  Add PostgreSQL Database:
echo    Go to Dashboard ^> New ^> PostgreSQL
echo    Database Name: transconnect
echo    User: transconnect_user
echo    Copy the DATABASE_URL to your web service environment
echo.
echo 7. 🔴 Add Redis (Optional):
echo    For session storage and caching
echo    Copy REDIS_URL to environment variables
echo.
echo 🔗 Useful Links:
echo • Render Dashboard: https://dashboard.render.com
echo • Render Docs: https://render.com/docs
echo • PostgreSQL on Render: https://render.com/docs/databases
echo.
echo 💡 Tips:
echo • Use Render's free tier for testing ($0/month with limitations)
echo • Upgrade to Starter plan ($7/month) for production
echo • Monitor logs in Render dashboard for deployment issues
echo • Health check endpoint: https://YOUR_APP.onrender.com/api/health
echo.
echo ✨ Your TransConnect backend will be live at:
echo    https://YOUR_APP_NAME.onrender.com
echo.
echo 🎉 Happy Deploying!
echo.
echo Press any key to open Render dashboard...
pause > nul
start https://render.com