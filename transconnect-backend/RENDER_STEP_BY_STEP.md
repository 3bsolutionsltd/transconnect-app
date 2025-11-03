# 🚀 Render Deployment - Step by Step Instructions

## STEP 1: Create PostgreSQL Database

1. **Go to**: https://dashboard.render.com
2. **Click**: "New +" → "PostgreSQL"
3. **Configure**:
   - Name: `transconnect-db`
   - Database Name: `transconnect`
   - User: `transconnect_user`
   - Region: `Oregon (US West)`
   - PostgreSQL Version: `15`
   - Plan: `Starter ($7/month)` or `Free` for testing
4. **Click**: "Create Database"
5. **Copy**: The "**Internal Database URL**" (starts with postgresql://)
   - ✅ Use INTERNAL URL (faster, more secure)
   - ❌ Don't use External URL (slower, public internet)

## STEP 2: Create Redis Cache (Optional)

1. **Click**: "New +" → "Redis"
2. **Configure**:
   - Name: `transconnect-redis`
   - Region: `Oregon (US West)`
   - Plan: `Starter ($7/month)` or `Free` for testing
3. **Click**: "Create Redis"
4. **Copy**: The "**Internal Redis URL**" (starts with redis://)

## STEP 3: Create Web Service

1. **Click**: "New +" → "Web Service"
2. **Connect Repository**: 
   - Select "Connect account" → GitHub
   - Choose `3bsolutionsltd/transconnect-app`
3. **Configure Service**:
   
   ### Basic Settings
   ```
   Name: transconnect-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: transconnect-backend
   Runtime: Node
   ```
   
   ### Build & Deploy
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```
   
   ### Plan
   ```
   Instance Type: Starter ($7/month)
   OR Free ($0/month) for testing
   ```

4. **Click**: "Advanced" → "Add Environment Variable"

## STEP 4: Add Environment Variables

Add these EXACT variables (copy/paste from RENDER_ENV_VARIABLES.md):

### Core Configuration
```
NODE_ENV = production
PORT = 3000
```

### Security Secrets
```
JWT_SECRET = 7a9f8e3d2c1b5a6f9e8d7c4b2a1f8e5d3c2b9a7f6e5d4c3b2a1f9e8d7c6b5a4f
JWT_REFRESH_SECRET = 3f7a9e2d8c5b1a6f4e9d7c0b3a2f1e8d5c4b9a7f6e3d2c1b8a5f4e7d0c9b6a3f
ENCRYPTION_KEY = 9b6e3d0c7a4f1e8d5c2b9a6f3e0d7c4b1a8f5e2d9c6b3a0f7e4d1c8b5a2f9e6d
SESSION_SECRET = 5d2a9f6e3c0b7a4f1e8d5c2b9a6f3e0d7c4b1a8f5e2d9c6b3a0f7e4d1c8b5a2f
BCRYPT_ROUNDS = 12
```

### Application Settings
```
CORS_ORIGIN = https://transconnect.vercel.app
API_RATE_LIMIT_WINDOW_MS = 900000
API_RATE_LIMIT_MAX_REQUESTS = 100
FILE_UPLOAD_MAX_SIZE = 10485760
```

### Database URLs (paste from your database services)
```
DATABASE_URL = [PASTE_POSTGRESQL_INTERNAL_URL_HERE]
REDIS_URL = [PASTE_REDIS_INTERNAL_URL_HERE]
```

**🔍 Important**: Always use **INTERNAL URLs** for better performance and security!

## STEP 5: Deploy!

1. **Click**: "Create Web Service"
2. **Wait**: 5-10 minutes for deployment
3. **Monitor**: Build logs in real-time
4. **Verify**: Health check endpoint

## STEP 6: Verify Deployment

### Health Check URLs
```
Basic Health: https://YOUR_APP_NAME.onrender.com/health
API Health: https://YOUR_APP_NAME.onrender.com/api/health
```

### Test API Endpoints
```bash
# Test basic connectivity
curl https://YOUR_APP_NAME.onrender.com/api/health

# Should return: {"status":"OK","timestamp":"...","service":"TransConnect Backend API","version":"1.0.0"}
```

## 🎉 SUCCESS!

Your TransConnect backend is now live at:
**https://YOUR_APP_NAME.onrender.com**

## Next Steps

1. ✅ Backend deployed
2. 🌐 Deploy frontend to Vercel
3. 📱 Update mobile app API endpoints
4. 💳 Configure payment providers
5. 📊 Set up monitoring

---

## 🚨 Troubleshooting

### Common Issues:
- **Build fails**: Check Node.js version (should be 18+)
- **Database connection**: Verify DATABASE_URL format
- **Memory issues**: Upgrade to Starter plan
- **CORS errors**: Check CORS_ORIGIN setting

### Debug Commands:
```bash
# Check service logs in Render dashboard
# Logs tab → Real-time logs

# Test database connection
curl -X POST https://YOUR_APP_NAME.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'
```