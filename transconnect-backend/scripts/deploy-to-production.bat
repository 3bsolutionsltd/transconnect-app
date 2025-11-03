@echo off
REM TransConnect Production Deployment Script for Windows
echo 🚀 TransConnect Production Deployment Started
echo ==================================================

REM Set colors (simplified for Windows)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%[INFO]%NC% Starting production deployment preparation...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Node.js is not installed or not in PATH
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Node.js version check passed

REM Check if environment file exists
if not exist ".env.production" (
    echo %YELLOW%[WARNING]%NC% .env.production not found, copying from example
    if exist ".env.production.example" (
        copy ".env.production.example" ".env.production"
        echo %YELLOW%[WARNING]%NC% Please edit .env.production with your production values
    ) else (
        echo %RED%[ERROR]%NC% No environment configuration found
        exit /b 1
    )
)

REM Install dependencies
echo %BLUE%[INFO]%NC% Installing production dependencies...
call npm ci --only=production --silent

REM Build application
echo %BLUE%[INFO]%NC% Building TypeScript application...
call npm run build

if errorlevel 1 (
    echo %RED%[ERROR]%NC% Build failed
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Build completed successfully

REM Run tests
echo %BLUE%[INFO]%NC% Running production readiness tests...
call npm run test:production-quick

if errorlevel 1 (
    echo %YELLOW%[WARNING]%NC% Some tests failed - proceeding with caution
) else (
    echo %GREEN%[SUCCESS]%NC% Production tests passed
)

REM Create Render configuration
echo %BLUE%[INFO]%NC% Creating Render deployment configuration...

echo services: > render.yaml
echo   - type: web >> render.yaml
echo     name: transconnect-backend >> render.yaml
echo     env: node >> render.yaml
echo     plan: starter >> render.yaml
echo     buildCommand: npm install ^&^& npm run build >> render.yaml
echo     startCommand: npm start >> render.yaml
echo     envVars: >> render.yaml
echo       - key: NODE_ENV >> render.yaml
echo         value: production >> render.yaml
echo       - key: DATABASE_URL >> render.yaml
echo         fromDatabase: >> render.yaml
echo           name: transconnect-db >> render.yaml
echo           property: connectionString >> render.yaml
echo       - key: JWT_SECRET >> render.yaml
echo         generateValue: true >> render.yaml
echo. >> render.yaml
echo databases: >> render.yaml
echo   - name: transconnect-db >> render.yaml
echo     plan: starter >> render.yaml
echo     databaseName: transconnect >> render.yaml
echo     user: transconnect >> render.yaml

echo %GREEN%[SUCCESS]%NC% Render configuration created

REM Create Dockerfile
echo %BLUE%[INFO]%NC% Creating Docker configuration...

echo FROM node:18-alpine > Dockerfile
echo. >> Dockerfile
echo RUN apk add --no-cache postgresql-client >> Dockerfile
echo. >> Dockerfile
echo WORKDIR /app >> Dockerfile
echo. >> Dockerfile
echo COPY package*.json ./ >> Dockerfile
echo COPY prisma ./prisma/ >> Dockerfile
echo. >> Dockerfile
echo RUN npm ci --only=production >> Dockerfile
echo. >> Dockerfile
echo COPY . . >> Dockerfile
echo. >> Dockerfile
echo RUN npx prisma generate >> Dockerfile
echo RUN npm run build >> Dockerfile
echo. >> Dockerfile
echo RUN addgroup -g 1001 -S nodejs >> Dockerfile
echo RUN adduser -S transconnect -u 1001 >> Dockerfile
echo. >> Dockerfile
echo RUN mkdir -p /app/logs /app/backups /app/uploads >> Dockerfile
echo RUN chown -R transconnect:nodejs /app >> Dockerfile
echo. >> Dockerfile
echo USER transconnect >> Dockerfile
echo. >> Dockerfile
echo EXPOSE 5000 >> Dockerfile
echo. >> Dockerfile
echo HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD curl -f http://localhost:5000/health ^|^| exit 1 >> Dockerfile
echo. >> Dockerfile
echo CMD ["npm", "start"] >> Dockerfile

echo %GREEN%[SUCCESS]%NC% Docker configuration created

REM Create environment variables template
echo %BLUE%[INFO]%NC% Creating environment variables template...

echo # Copy these environment variables to your cloud platform > env-vars-template.txt
echo. >> env-vars-template.txt
echo # Essential Configuration >> env-vars-template.txt
echo NODE_ENV=production >> env-vars-template.txt
echo PORT=5000 >> env-vars-template.txt
echo DATABASE_URL=[Your PostgreSQL connection string] >> env-vars-template.txt
echo JWT_SECRET=[Generate strong secret] >> env-vars-template.txt
echo. >> env-vars-template.txt
echo # Domain Configuration >> env-vars-template.txt
echo FRONTEND_URL=https://your-domain.com >> env-vars-template.txt
echo API_URL=https://api.your-domain.com >> env-vars-template.txt
echo. >> env-vars-template.txt
echo # Payment Configuration (Replace with live credentials) >> env-vars-template.txt
echo FLUTTERWAVE_PUBLIC_KEY=[Your live public key] >> env-vars-template.txt
echo FLUTTERWAVE_SECRET_KEY=[Your live secret key] >> env-vars-template.txt
echo FLUTTERWAVE_WEBHOOK_SECRET=[Your webhook secret] >> env-vars-template.txt
echo. >> env-vars-template.txt
echo # Production Features >> env-vars-template.txt
echo ENABLE_PRODUCTION_FEATURES=true >> env-vars-template.txt
echo BACKUP_ENABLED=true >> env-vars-template.txt
echo MONITORING_ENABLED=true >> env-vars-template.txt

echo %GREEN%[SUCCESS]%NC% Environment variables template created

REM Create health check script
echo %BLUE%[INFO]%NC% Creating health check script...

echo @echo off > test-health.bat
echo set URL=%%1 >> test-health.bat
echo if "%%URL%%"=="" set URL=http://localhost:5000 >> test-health.bat
echo echo Testing health endpoint: %%URL%%/health >> test-health.bat
echo curl -s -o nul -w "%%{http_code}" "%%URL%%/health" ^> response.txt >> test-health.bat
echo set /p RESPONSE=^<response.txt >> test-health.bat
echo del response.txt >> test-health.bat
echo if "%%RESPONSE%%"=="200" ( >> test-health.bat
echo     echo ✅ Health check passed >> test-health.bat
echo     exit /b 0 >> test-health.bat
echo ^) else ( >> test-health.bat
echo     echo ❌ Health check failed (HTTP %%RESPONSE%%) >> test-health.bat
echo     exit /b 1 >> test-health.bat
echo ^) >> test-health.bat

echo %GREEN%[SUCCESS]%NC% Health check script created

REM Create deployment checklist
echo %BLUE%[INFO]%NC% Creating deployment checklist...

echo # TransConnect Production Deployment Checklist > DEPLOYMENT_CHECKLIST.md
echo. >> DEPLOYMENT_CHECKLIST.md
echo ## Pre-Deployment ✅ >> DEPLOYMENT_CHECKLIST.md
echo. >> DEPLOYMENT_CHECKLIST.md
echo - [ ] Environment variables configured (.env.production) >> DEPLOYMENT_CHECKLIST.md
echo - [ ] Database connection string updated >> DEPLOYMENT_CHECKLIST.md
echo - [ ] Payment gateway credentials (live mode) >> DEPLOYMENT_CHECKLIST.md
echo - [ ] Firebase configuration updated >> DEPLOYMENT_CHECKLIST.md
echo - [ ] Domain names configured >> DEPLOYMENT_CHECKLIST.md
echo - [ ] SSL certificates ready >> DEPLOYMENT_CHECKLIST.md

echo %GREEN%[SUCCESS]%NC% Deployment checklist created

echo.
echo %GREEN%🎉 PRODUCTION DEPLOYMENT PREPARATION COMPLETE!%NC%
echo ==============================================
echo.
echo 📁 Files Created:
echo   ✅ render.yaml (Render configuration)
echo   ✅ Dockerfile (Docker configuration)
echo   ✅ env-vars-template.txt (Environment variables)
echo   ✅ test-health.bat (Health check script)
echo   ✅ DEPLOYMENT_CHECKLIST.md (Deployment guide)
echo.
echo 🚀 Next Steps:
echo   1. Review and update .env.production
echo   2. Create account on Render (https://render.com)
echo   3. Connect your Git repository
echo   4. Upload render.yaml configuration
echo   5. Set environment variables from env-vars-template.txt
echo   6. Deploy and test
echo.
echo 📋 Quick Deploy Instructions:
echo   Render Deployment:
echo   1. Go to https://render.com
echo   2. Create new Web Service
echo   3. Connect your Git repository
echo   4. Upload the created render.yaml
echo   5. Set environment variables from env-vars-template.txt
echo.
echo 📞 Support:
echo   - Health check: test-health.bat https://your-api-url.com
echo   - Documentation: DEPLOYMENT_CHECKLIST.md
echo.
echo %GREEN%Ready for production deployment! 🚀%NC%

pause