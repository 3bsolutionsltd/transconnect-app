# TransConnect Domain Configuration Guide

## Domain Structure Overview

Your TransConnect platform will use the following domain structure:

- **Passengers**: `transconnect.app` or `www.transconnect.app` (Main booking site)
- **Agents**: `transconnect.app/agents` (Agent portal and registration)
- **Admin**: `admin.transconnect.app` (Admin dashboard)
- **Operators**: `operators.transconnect.app` OR `transconnect.app/operators` (Choose one)

## DNS Configuration

### 1. Main Domain Records
```
Type: A
Name: @
Value: [Your hosting provider IP - e.g., Vercel/Netlify IP]

Type: CNAME  
Name: www
Value: transconnect.app
```

### 2. Admin Subdomain
```
Type: CNAME
Name: admin
Value: [admin-deployment-url] (e.g., transconnect-admin.vercel.app)
```

### 3. Operators Subdomain (if using subdomain approach)
```
Type: CNAME
Name: operators  
Value: [operators-deployment-url] (e.g., transconnect-operators.vercel.app)
```

## Deployment Strategy

### Option A: Separate Deployments (Recommended)
1. **Main Site** (`transconnect.app`): Deploy `transconnect-web` to Vercel/Netlify
2. **Admin** (`admin.transconnect.app`): Deploy `transconnect-admin` to Vercel/Netlify
3. **Operators** (`operators.transconnect.app`): Deploy operators portal separately

### Option B: Single Deployment with Routing
1. Deploy `transconnect-web` with all routes to main domain
2. Use subdomain routing in Next.js (already configured)
3. All traffic routes through single deployment

## Vercel Deployment Steps

### 1. Main Site (transconnect.app)
```bash
cd transconnect-web
vercel --prod
# Set custom domain: transconnect.app
# Set environment variables from .env.production.example
```

### 2. Admin Dashboard (admin.transconnect.app)
```bash  
cd transconnect-admin
vercel --prod
# Set custom domain: admin.transconnect.app
```

### 3. Operators Portal (operators.transconnect.app)
```bash
# Create separate deployment or use routing approach
```

## Environment Variables

### Main Site (transconnect-web)
```bash
NEXT_PUBLIC_SITE_URL=https://transconnect.app
NEXT_PUBLIC_API_URL=https://transconnect-backend-[ID].onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://transconnect-backend-[ID].onrender.com
```

### Backend (Render)
```bash
CORS_ORIGINS=https://transconnect.app,https://www.transconnect.app,https://admin.transconnect.app,https://operators.transconnect.app
```

## Testing Your Setup

### 1. Test Main Domain
- `https://transconnect.app` → Passenger booking site
- `https://www.transconnect.app` → Should redirect or serve same content

### 2. Test Agent Portal  
- `https://transconnect.app/agents` → Agent registration/login

### 3. Test Admin Subdomain
- `https://admin.transconnect.app` → Admin dashboard

### 4. Test Operators
- `https://operators.transconnect.app` → Operators portal
- OR `https://transconnect.app/operators` → If using path approach

## SSL/HTTPS Configuration

Most hosting providers (Vercel, Netlify) automatically handle SSL certificates for custom domains including subdomains. Ensure all domains have valid SSL certificates.

## Current Status

✅ **Completed:**
- Next.js routing configured for all paths
- CORS settings updated in backend
- Admin subdomain structure created  
- Operators subdomain structure created
- Agents portal already exists at `/agents`
- Environment configuration examples provided

🔄 **Next Steps:**
1. Configure DNS records for transconnect.app
2. Deploy to hosting provider with custom domains
3. Update environment variables
4. Test all domain routing

## Recommended Approach

I recommend **Option A (Separate Deployments)** because:
- Better performance (each app optimized separately)
- Easier scaling and maintenance
- Clear separation of concerns
- Independent deployment cycles
- Better SEO with dedicated subdomains

Would you like me to help you with any specific deployment step?