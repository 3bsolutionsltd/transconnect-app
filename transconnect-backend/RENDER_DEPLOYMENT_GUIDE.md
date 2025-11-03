# 🚀 TransConnect Backend - Render Deployment Guide

## ✅ Pre-Deployment Status
- ✅ TypeScript compilation: **PASSED**
- ✅ Required files: **ALL PRESENT**
- ✅ Environment configuration: **READY**
- ✅ Health check endpoints: **/health** and **/api/health**
- ✅ Database schema: **CONFIGURED**
- ✅ Render configuration: **render.yaml**

---

## 🌐 Deploy to Render (Step-by-Step)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up or login
3. Connect your GitHub account

### Step 2: Push Code to GitHub
```bash
# If you haven't already, push your code to GitHub
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### Step 3: Create Web Service
1. **Dashboard** → **New** → **Web Service**
2. **Connect Repository**: Select your TransConnect repository
3. **Configure Service:**
   - **Name**: `transconnect-backend`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Root Directory**: `transconnect-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Starter ($7/month)` or `Free` for testing

### Step 4: Add PostgreSQL Database
1. **Dashboard** → **New** → **PostgreSQL**
2. **Configure Database:**
   - **Name**: `transconnect-db`
   - **Database Name**: `transconnect`
   - **User**: `transconnect_user`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Starter ($7/month)` or `Free` for testing
3. **Copy the Database URL** (Internal Connection String)

### Step 5: Add Redis (Optional)
1. **Dashboard** → **New** → **Redis**
2. **Configure Redis:**
   - **Name**: `transconnect-redis`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Starter ($7/month)` or `Free` for testing
3. **Copy the Redis URL**

### Step 6: Configure Environment Variables
In your **Web Service** → **Environment** tab, add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=[paste-postgresql-internal-url]
REDIS_URL=[paste-redis-url]
JWT_SECRET=[generate-32-char-random-string]
JWT_REFRESH_SECRET=[generate-32-char-random-string]
ENCRYPTION_KEY=[generate-32-char-random-string]
SESSION_SECRET=[generate-32-char-random-string]
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://transconnect.vercel.app
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100
FILE_UPLOAD_MAX_SIZE=10485760
```

**Generate Random Secrets:**
```bash
# Use this command to generate random strings:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 7: Deploy!
1. Click **Deploy** or **Create Web Service**
2. Monitor the build logs
3. Wait for deployment to complete (5-10 minutes)

---

## 📊 Post-Deployment Verification

### Health Check URLs
- **Basic Health**: `https://your-app-name.onrender.com/health`
- **API Health**: `https://your-app-name.onrender.com/api/health`

### Test API Endpoints
```bash
# Test registration
curl -X POST https://your-app-name.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}'

# Test login
curl -X POST https://your-app-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
```

---

## 🔧 Production Configuration

### Database Migration
Your Prisma migrations will run automatically during deployment, but you can also run them manually:

```bash
# Access Render shell (if needed)
npx prisma migrate deploy
npx prisma db seed
```

### Monitoring & Logs
1. **Render Dashboard** → **Your Service** → **Logs**
2. Monitor CPU, Memory, and Response times
3. Set up alerts for downtime

### Custom Domain (Optional)
1. **Service Settings** → **Custom Domains**
2. Add your domain (e.g., `api.transconnect.com`)
3. Configure DNS CNAME record

---

## 💡 Cost Optimization

### Free Tier Limitations
- **Web Service**: Spins down after 15 min of inactivity
- **Database**: 1GB storage, 1 concurrent connection
- **Redis**: 25MB memory

### Production Recommendations
- **Web Service**: Starter ($7/month) - always on
- **Database**: Starter ($7/month) - 1GB storage, 5 connections
- **Redis**: Starter ($7/month) - 512MB memory

**Total Monthly Cost**: ~$21/month for production-ready setup

---

## 🚨 Troubleshooting

### Common Issues
1. **Build Fails**: Check TypeScript compilation locally first
2. **Database Connection**: Verify DATABASE_URL is correctly set
3. **CORS Errors**: Update CORS_ORIGIN environment variable
4. **Health Check Fails**: Ensure `/api/health` endpoint returns 200

### Debug Commands
```bash
# Check service status
curl https://your-app-name.onrender.com/api/health

# View logs in Render dashboard
# Service → Logs tab

# Shell access (if needed)
# Service → Shell tab
```

---

## ✨ Next Steps

After successful backend deployment:

1. ✅ **Backend Live**: `https://your-app-name.onrender.com`
2. 🌐 **Deploy Frontend**: Use Vercel for the React web portal
3. 📱 **Configure Mobile**: Update API endpoints in Flutter app
4. 💳 **Payment Integration**: Configure live payment APIs
5. 📊 **Monitoring**: Set up production monitoring and alerts

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **PostgreSQL Guide**: https://render.com/docs/databases
- **Node.js on Render**: https://render.com/docs/deploy-node-express-app

---

**🎉 Your TransConnect backend is ready for production deployment!**

**Remember**: After deployment, update your frontend and mobile app to use the new API URL: `https://your-app-name.onrender.com`