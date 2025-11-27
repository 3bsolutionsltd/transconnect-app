# TransConnect.app Deployment Strategy
## Based on Your Current Setup (Render + Vercel)

### 🏗️ **Current Infrastructure:**
- **Backend**: Render.com (`https://transconnect-app-44ie.onrender.com`)
- **Frontend**: Vercel (with API proxy to Render)
- **Project**: Monorepo with all components

### 🎯 **RECOMMENDED APPROACH: Hybrid Deployment (Perfect Setup!)**

Given your current setup with separate admin deployment, this is the **optimal architecture**:

#### **Deployment Structure:**
```
transconnect.app (Main Vercel Project - transconnect-web)
├── / → Passenger booking site ✅
└── /agents → Agent portal ✅

admin.transconnect.app (Separate Vercel Project - transconnect-admin)
└── / → Admin dashboard ✅ (https://transconnect-admin.vercel.app)

operators.transconnect.app (Optional: Separate or route to /operators)
└── / → Operators portal
```

#### **Subdomain Routing:**
```
transconnect.app → Main passenger site (transconnect-web)
www.transconnect.app → Redirect to main site
admin.transconnect.app → Separate admin deployment (transconnect-admin)
operators.transconnect.app → Route to /operators OR separate deployment
```

### 🚀 **STEP-BY-STEP DEPLOYMENT:**

#### **1. Configure Main Site Domain (transconnect-web)**

In your existing Vercel project for transconnect-web:

```bash
cd transconnect-web
# Your project is already deployed
# Just add custom domains in Vercel dashboard
```

#### **2. Configure Admin Site Domain (transconnect-admin)**

In your existing admin Vercel project (https://transconnect-admin.vercel.app):

```bash
cd transconnect-admin
# Your project is already deployed
# Just add custom domain in Vercel dashboard
```

#### **3. Add Custom Domains in Vercel Dashboards**

**For transconnect-web project** → Settings → Domains:
- Add: `transconnect.app` (primary)
- Add: `www.transconnect.app`
- Add: `operators.transconnect.app` (if using /operators routing)

**For transconnect-admin project** → Settings → Domains:
- Add: `admin.transconnect.app`

#### **4. DNS Configuration**

At your domain registrar (where you bought transconnect.app):

```bash
# Main domain (points to transconnect-web Vercel project)
A record: @ → 76.76.19.61 (Vercel IP)
CNAME: www → transconnect.app

# Admin subdomain (points to transconnect-admin Vercel project)  
CNAME: admin → cname.vercel-dns.com

# Operators subdomain (points to transconnect-web or separate project)
CNAME: operators → cname.vercel-dns.com
```

#### **4. Update Environment Variables**

In your Vercel project dashboard → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://transconnect-app-44ie.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://transconnect-app-44ie.onrender.com
NEXT_PUBLIC_SITE_URL=https://transconnect.app
```

### ✅ **ADVANTAGES OF THIS APPROACH:**

1. **Simple Management**: One deployment, one domain setup
2. **Cost Effective**: Single Vercel project handles everything
3. **Consistent Backend**: Your Render backend serves all frontends
4. **Easy Updates**: One codebase, one deployment pipeline
5. **Fast Setup**: No need to create separate projects

### 🔄 **How Routing Works:**

```
User visits admin.transconnect.app 
→ Vercel middleware detects subdomain
→ Routes internally to /admin pages
→ API calls still go to your Render backend
→ User sees admin interface
```

### 📋 **IMPLEMENTATION CHECKLIST:**

- [x] ✅ Vercel.json updated for domain routing
- [x] ✅ Next.js middleware configured for subdomains  
- [x] ✅ Admin pages created (/admin/*)
- [x] ✅ Operators pages created (/operators/*)
- [x] ✅ Backend CORS updated for all domains

#### **Remaining Steps:**
- [ ] Add custom domains in Vercel dashboard
- [ ] Configure DNS records at domain registrar
- [ ] Update environment variables in Vercel
- [ ] Test all subdomain routing
- [ ] Update mobile app API URLs if needed

### 🧪 **TESTING PLAN:**

1. **Local Testing**: 
   - Edit hosts file: `127.0.0.1 admin.transconnect.app`
   - Test subdomain routing in development

2. **Production Testing**:
   ```bash
   curl -H "Host: admin.transconnect.app" https://transconnect.app
   curl -H "Host: operators.transconnect.app" https://transconnect.app
   ```

### 💡 **ALTERNATIVE: Separate Deployments**

If you prefer separate deployments later:
1. Deploy `transconnect-admin` to separate Vercel project
2. Point `admin.transconnect.app` to that project
3. Same for operators

But for now, **single deployment is simpler** and uses your existing setup.

### 🔧 **BACKEND CONFIGURATION (Already Done)**

Your Render backend is already configured with:
- ✅ CORS for all transconnect.app domains
- ✅ Agent activity tracking fixes
- ✅ SMS system working perfectly
- ✅ Auto-deployment from GitHub

### 🎯 **NEXT ACTION:**

Ready to deploy! Just:
1. Go to your Vercel dashboard
2. Add the custom domains
3. Configure DNS
4. Test the routing

Your backend on Render will continue working seamlessly! 🚀