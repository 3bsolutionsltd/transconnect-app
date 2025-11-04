# TransConnect Admin Dashboard - Quick Deploy Guide

## 🚀 Deploy Admin Dashboard to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **New Project** → **Import Git Repository**
3. **Repository Settings**:
   ```
   Repository: 3bsolutionsltd/transconnect-app
   Framework Preset: Create React App
   Root Directory: transconnect-admin
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Environment Variables** (Add these in Vercel):
   ```bash
   REACT_APP_API_URL=https://transconnect-app-44ie.onrender.com
   REACT_APP_ENVIRONMENT=production
   REACT_APP_ENABLE_ANALYTICS=true
   REACT_APP_SESSION_TIMEOUT=3600
   REACT_APP_ENABLE_2FA=true
   ```

5. **Deploy** → Wait 2-3 minutes

### Option 2: Vercel CLI (Alternative)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to admin folder
cd transconnect-admin

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name: transconnect-admin
# - Framework: Create React App
# - Deploy? Yes
```

## 📋 Expected Results

- **Build Time**: ~2-3 minutes
- **URL Format**: `https://transconnect-admin-xxx.vercel.app`
- **Features**: Operator dashboard, analytics, route management
- **API Connection**: Auto-configured to production backend

## 🔧 Post-Deployment

1. **Test Admin Login**: Use the demo admin credentials
2. **Verify API Connection**: Check dashboard loads operator data
3. **Update CORS**: Add admin domain to backend CORS settings

## 🚨 Troubleshooting

If build fails:
- Ensure `transconnect-admin` root directory is selected
- Verify framework preset is "Create React App"
- Check build logs for specific errors

---

**Ready to deploy the admin dashboard now!** 🎯