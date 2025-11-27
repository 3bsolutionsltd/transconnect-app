# 🚀 TransConnect.app Domain Setup Guide
## For Your Existing Render + Dual Vercel Setup

### 🏗️ **Your Current Setup (Perfect!):**
- **Backend**: Render.com (`transconnect-app-44ie.onrender.com`) ✅
- **Main Site**: Vercel (`transconnect-web`) ✅  
- **Admin Site**: Vercel (`transconnect-admin.vercel.app`) ✅

### 🎯 **Final Domain Architecture:**
```
transconnect.app → Passengers (transconnect-web Vercel project)
transconnect.app/agents → Agents (same project)
admin.transconnect.app → Admin Dashboard (transconnect-admin Vercel project)  
operators.transconnect.app → Operators (transconnect-web /operators pages)
```

---

## 🔧 **IMPLEMENTATION STEPS:**

### **Step 1: Configure Main Site Domain**

**Go to:** Vercel Dashboard → Your `transconnect-web` project → Settings → Domains

**Add these domains:**
- `transconnect.app` (primary)
- `www.transconnect.app` 
- `operators.transconnect.app`

### **Step 2: Configure Admin Site Domain**

**Go to:** Vercel Dashboard → Your `transconnect-admin` project → Settings → Domains

**Add this domain:**
- `admin.transconnect.app`

### **Step 3: DNS Configuration**

**At your domain registrar** (where you bought transconnect.app):

```bash
# Main domain (points to transconnect-web)
A record: @ → 76.76.19.61 
CNAME: www → transconnect.app

# Admin subdomain (points to transconnect-admin)
CNAME: admin → cname.vercel-dns.com

# Operators subdomain (points to transconnect-web)  
CNAME: operators → cname.vercel-dns.com
```

### **Step 4: Update Environment Variables**

**In transconnect-web Vercel project:**
```bash
NEXT_PUBLIC_API_URL=https://transconnect-app-44ie.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://transconnect-app-44ie.onrender.com
NEXT_PUBLIC_SITE_URL=https://transconnect.app
```

**In transconnect-admin Vercel project:**
```bash
REACT_APP_API_URL=https://transconnect-app-44ie.onrender.com/api
```

---

## ✅ **WHAT HAPPENS AFTER SETUP:**

### **User Experience:**
- **`transconnect.app`** → Beautiful passenger booking site
- **`transconnect.app/agents`** → Agent registration & dashboard  
- **`admin.transconnect.app`** → Your existing admin dashboard
- **`operators.transconnect.app`** → Operators management portal

### **Technical Flow:**
- All domains have SSL certificates (automatic via Vercel)
- API calls from all frontends go to your Render backend
- Each frontend is optimized for its specific user type
- Professional domain structure for business growth

---

## 🧪 **TESTING CHECKLIST:**

After DNS propagation (24-48 hours):

- [ ] `https://transconnect.app` loads passenger site
- [ ] `https://www.transconnect.app` redirects to main site
- [ ] `https://transconnect.app/agents` loads agent portal  
- [ ] `https://admin.transconnect.app` loads admin dashboard
- [ ] `https://operators.transconnect.app` loads operators portal
- [ ] All API calls work (backend integration intact)
- [ ] SSL certificates active on all domains

---

## 🎉 **ADVANTAGES OF YOUR SETUP:**

✅ **Separation of Concerns**: Admin is completely separate
✅ **Performance**: Each app optimized independently  
✅ **Security**: Admin isolated from public site
✅ **Scalability**: Can scale each component separately
✅ **Development**: Teams can work independently
✅ **Professional**: Clean domain structure

---

## 🚨 **IMPORTANT NOTES:**

1. **DNS Propagation**: Takes 24-48 hours globally
2. **SSL Certificates**: Vercel automatically handles HTTPS
3. **Backend Integration**: Your Render backend serves all frontends
4. **Admin Security**: Consider adding authentication for admin.transconnect.app
5. **Mobile App**: Update API URLs if needed

---

## 🔄 **DEPLOYMENT WORKFLOW:**

```bash
# Main site updates
cd transconnect-web
git push origin main  # Auto-deploys to transconnect.app

# Admin updates  
cd transconnect-admin
git push origin main  # Auto-deploys to admin.transconnect.app

# Backend updates
cd transconnect-backend  
git push origin main  # Auto-deploys to Render (serves all frontends)
```

Your setup is **enterprise-ready** and follows best practices! 🚀