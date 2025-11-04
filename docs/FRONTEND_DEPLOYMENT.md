# Frontend Deployment Guide - Vercel

## 🌐 Overview
Deploy both TransConnect frontend applications to Vercel for production use:
- **transconnect-web**: Next.js booking portal for passengers
- **transconnect-admin**: React dashboard for operators and admins

## 🚀 Quick Deployment Steps

### Prerequisites
1. **Vercel Account**: Sign up at https://vercel.com
2. **GitHub Integration**: Connect your GitHub account
3. **Production Backend**: ✅ Running at https://transconnect-app-44ie.onrender.com

### Deploy Web Portal (Next.js)

1. **Import from GitHub**:
   ```bash
   # In Vercel dashboard
   New Project → Import Git Repository
   Repository: 3bsolutionsltd/transconnect-app
   Root Directory: transconnect-web
   Framework Preset: Next.js
   ```

2. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_API_URL=https://transconnect-app-44ie.onrender.com
   NEXT_PUBLIC_ENVIRONMENT=production
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

3. **Deploy**: Click "Deploy" and wait 2-3 minutes

### Deploy Admin Dashboard (React)

1. **Import from GitHub**:
   ```bash
   # In Vercel dashboard
   New Project → Import Git Repository
   Repository: 3bsolutionsltd/transconnect-app
   Root Directory: transconnect-admin
   Framework Preset: Create React App
   ```

2. **Environment Variables**:
   ```bash
   REACT_APP_API_URL=https://transconnect-app-44ie.onrender.com
   REACT_APP_ENVIRONMENT=production
   REACT_APP_ENABLE_ANALYTICS=true
   ```

3. **Build Command**: 
   ```bash
   npm run build
   ```

4. **Deploy**: Click "Deploy" and wait 2-3 minutes

## 📋 Post-Deployment Configuration

### 1. Update CORS Settings
Add your Vercel domains to the backend CORS configuration:

```javascript
// In your backend environment variables
CORS_ORIGINS=https://your-web-app.vercel.app,https://your-admin-app.vercel.app
```

### 2. Test Deployments
- **Web Portal**: Test booking flow and API connectivity
- **Admin Dashboard**: Test login and operator management
- **Backend Health**: Verify https://transconnect-app-44ie.onrender.com/health

### 3. Configure Custom Domains (Optional)
```bash
# In Vercel project settings
Domains → Add Custom Domain
web.transconnect.ug → transconnect-web
admin.transconnect.ug → transconnect-admin
```

## 🔧 Alternative: Deploy via CLI

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy Web Portal
```bash
cd transconnect-web
vercel --prod
```

### Deploy Admin Dashboard
```bash
cd transconnect-admin
vercel --prod
```

## 📊 Expected Results

### Web Portal
- **URL**: https://transconnect-web-xxx.vercel.app
- **Features**: Route search, booking, payment, QR tickets
- **Performance**: <3s load time, mobile-optimized

### Admin Dashboard
- **URL**: https://transconnect-admin-xxx.vercel.app
- **Features**: Operator management, analytics, QR scanner
- **Access**: Restricted to admin/operator accounts

## 🔐 Security Configuration

### Content Security Policy
Both apps include CSP headers via `vercel.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: enabled

### Environment Variables Security
- All sensitive keys stored in Vercel environment
- API URLs use HTTPS only
- No secrets exposed in client code

## 🚨 Troubleshooting

### Build Failures
```bash
# Check Node.js version compatibility
"engines": {
  "node": ">=18.0.0"
}
```

### API Connection Issues
- Verify backend is running: https://transconnect-app-44ie.onrender.com/health
- Check CORS settings allow your Vercel domains
- Validate environment variables in Vercel dashboard

### Performance Issues
- Enable Vercel Analytics
- Check bundle size with `npm run analyze`
- Optimize images and assets

## 📞 Next Steps After Deployment

1. ✅ Test all user flows end-to-end
2. 🔧 Configure payment gateway integrations
3. 📱 Set up mobile app deployments
4. 🔍 Implement monitoring and analytics
5. 🚀 Prepare for pilot launch

---

**Support**: Monitor deployments in Vercel dashboard and check logs for any issues.