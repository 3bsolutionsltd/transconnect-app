# TransConnect Cloud Platform Deployment Guide

## 🚀 Cloud Platform Options

### Option 1: Render (Recommended for MVP)
**Why Render is Great for TransConnect:**
- ✅ **Simplest setup** - Git-based deployment
- ✅ **PostgreSQL included** - Managed database service
- ✅ **Free tier available** - Start free, scale as needed
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **SSL certificates** - Automatic HTTPS
- ✅ **Great for Node.js** - Optimized for our stack

**Pricing:**
- Free tier: Perfect for testing and demo
- Starter: $7/month (recommended for launch)
- Pro: $25/month (for scaling)

**Deployment Steps:**
1. Push code to GitHub
2. Connect Render to repository
3. Configure environment variables
4. Deploy with one click

### Option 2: Railway
**Why Railway is Good:**
- ✅ **Developer-friendly** - Great DX
- ✅ **Simple pricing** - Usage-based
- ✅ **Fast deployments** - Quick builds
- ✅ **Good PostgreSQL** - Managed database

**Pricing:**
- Pay-as-you-go: $0.000463/GB-hour
- Estimated: $5-20/month for MVP

### Option 3: Heroku
**Why Heroku (Classic choice):**
- ✅ **Mature platform** - Battle-tested
- ✅ **Great add-ons** - Lots of integrations
- ✅ **Easy scaling** - Dyno-based scaling

**Pricing:**
- Basic: $7/month per dyno
- Database: $9/month

## 🎯 **Recommended Choice: Render**

For TransConnect MVP, I recommend **Render** because:
1. **Cost-effective** - Free tier for testing, affordable scaling
2. **Simple setup** - Minimal configuration needed
3. **Managed database** - PostgreSQL included
4. **Auto SSL** - Security built-in
5. **Great for Node.js** - Optimized performance

## 🚀 Quick Deploy to Render

### Step 1: Prepare Repository
```bash
# Make sure code is pushed to GitHub
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access repositories

### Step 3: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your repository
3. Configure service:
   - **Name**: transconnect-backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 4: Add Database
1. Click "New +" → "PostgreSQL"
2. Name: transconnect-db
3. Copy connection string

### Step 5: Environment Variables
Add these in Render dashboard:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=[Your PostgreSQL connection string from Render]
JWT_SECRET=[Generate strong secret - use https://jwt.io]
FRONTEND_URL=https://your-frontend-url.onrender.com
FLUTTERWAVE_PUBLIC_KEY=[Your live Flutterwave key]
FLUTTERWAVE_SECRET_KEY=[Your live Flutterwave secret]
ENABLE_PRODUCTION_FEATURES=true
BACKUP_ENABLED=true
MONITORING_ENABLED=true
```

### Step 6: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Test health endpoint: `https://your-app.onrender.com/health`

## 🔧 Frontend Deployment (Vercel)

### For Web Portal:
```bash
cd ../transconnect-web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure environment variables in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### For Admin Dashboard:
```bash
cd ../transconnect-admin

# Deploy to Vercel
vercel

# Configure environment
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## 📱 Mobile App Setup

### Update Flutter Configuration:
```dart
// lib/config/api_config.dart
class ApiConfig {
  static const String baseUrl = 'https://your-backend.onrender.com/api';
  static const String environment = 'production';
}
```

## 🔐 Security Setup

### 1. Generate Strong Secrets
```bash
# JWT Secret (256-bit)
openssl rand -base64 32

# Backup Encryption Key
openssl rand -base64 32

# Session Secret
openssl rand -base64 32
```

### 2. Configure CORS
```
CORS_ORIGIN=https://your-frontend.vercel.app,https://your-admin.vercel.app
```

### 3. Enable HTTPS Only
All cloud platforms provide SSL automatically.

## 💳 Payment Gateway Setup

### Flutterwave Live Setup:
1. Go to https://dashboard.flutterwave.com
2. Switch to "Live" mode
3. Get live API keys
4. Configure webhook URL: `https://your-backend.onrender.com/api/payments/webhook`

### MTN Mobile Money:
1. Register at MTN Developer Portal
2. Get live credentials
3. Configure callback URLs

### Airtel Money:
1. Register at Airtel Developer Portal
2. Get live credentials
3. Configure callback URLs

## 🚦 Deployment Process

### Pre-Deployment Checklist
```bash
# 1. Run production setup
npm run production:setup

# 2. Test locally with production config
NODE_ENV=production npm start

# 3. Test health endpoint
curl http://localhost:5000/health

# 4. Run production tests
npm run test:production
```

### Deploy Backend
1. ✅ Push to GitHub
2. ✅ Create Render web service
3. ✅ Add PostgreSQL database
4. ✅ Configure environment variables
5. ✅ Deploy and test

### Deploy Frontend
1. ✅ Update API URLs in frontend
2. ✅ Deploy web portal to Vercel
3. ✅ Deploy admin dashboard to Vercel
4. ✅ Configure custom domains (optional)

### Configure Payments
1. ✅ Set up live Flutterwave account
2. ✅ Configure webhook endpoints
3. ✅ Test payment flow
4. ✅ Set up MTN/Airtel APIs

### Final Testing
1. ✅ Complete user journey test
2. ✅ Admin dashboard functionality
3. ✅ Payment processing
4. ✅ Notification system
5. ✅ Mobile app integration

## 🎯 Success Metrics

After deployment, monitor:
- **Health endpoint**: Should return 200 OK
- **Database connections**: Check connection pool
- **Payment success rate**: Should be >95%
- **API response time**: Should be <500ms
- **Error rate**: Should be <1%

## 📞 Support & Monitoring

### Health Monitoring
```bash
# Check backend health
curl https://your-backend.onrender.com/health

# Check database status
curl https://your-backend.onrender.com/api/admin/database/health
```

### Log Monitoring
- Render provides automatic log aggregation
- Check logs in Render dashboard
- Set up error alerting

## 🎉 Go Live!

Once everything is deployed and tested:
1. ✅ Update DNS (if using custom domain)
2. ✅ Announce launch
3. ✅ Onboard first bus operators
4. ✅ Monitor system performance
5. ✅ Collect user feedback

---

**Ready to deploy? Choose your platform and follow the guide above!** 🚀