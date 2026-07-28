# 🚀 TransConnect - Production Deployment Quick Guide
**Status**: Ready to Deploy  
**Estimated Time**: 2-4 hours  
**Date**: June 29, 2026

---

## ⚡ **QUICK START: 4 Steps to Production**

### Step 1: Generate Production Secrets (5 minutes)

Open PowerShell and run:

```powershell
# Generate JWT Secret (512-bit)
openssl rand -hex 64

# Generate Webhook Secrets
openssl rand -hex 32  # For MTN
openssl rand -hex 32  # For Airtel

# Generate strong database password
openssl rand -base64 32
```

**Save these securely!** You'll need them in Step 2.

---

### Step 2: Update Backend Environment Variables (30 minutes)

#### 2.1 Go to Render Dashboard
1. Visit https://dashboard.render.com
2. Select your service: `transconnect-app`
3. Go to **Environment** tab
4. Click **Edit** 

#### 2.2 Update/Add These Variables

Copy and paste this into Render environment settings (update values in `<>`):

```bash
# ────────────────────────────────────
# CORE CONFIGURATION
# ────────────────────────────────────
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# ────────────────────────────────────
# URLS
# ────────────────────────────────────
FRONTEND_URL=https://transconnect.app
ADMIN_URL=https://admin.transconnect.app
API_URL=https://api.transconnect.app
CORS_ORIGIN=https://transconnect.app,https://www.transconnect.app,https://admin.transconnect.app

# ────────────────────────────────────
# DATABASE (Keep existing Render PostgreSQL URL)
# ────────────────────────────────────
DATABASE_URL=<your existing render postgres url>

# Optional: Add Redis for caching
# REDIS_URL=<your redis url>

# ────────────────────────────────────
# AUTHENTICATION
# ────────────────────────────────────
JWT_SECRET=<paste the 64-byte hex you generated>
JWT_EXPIRES_IN=7d

# ────────────────────────────────────
# PAYMENT: PESAPAL (PRODUCTION)
# ────────────────────────────────────
PAYMENT_DEMO_MODE=false
PESAPAL_CONSUMER_KEY=<get from pay.pesapal.com>
PESAPAL_CONSUMER_SECRET=<get from pay.pesapal.com>
PESAPAL_ENVIRONMENT=production
PESAPAL_IPN_URL=https://api.transconnect.app/api/payments/ipn/pesapal

# ────────────────────────────────────
# PAYMENT: MTN MOBILE MONEY (Optional)
# ────────────────────────────────────
MTN_MOMO_SUBSCRIPTION_KEY=<your subscription key>
MTN_MOMO_USER_ID=<your user id>
MTN_MOMO_API_KEY=<your api key>
MTN_MOMO_ENVIRONMENT=production
MTN_WEBHOOK_URL=https://api.transconnect.app/api/payments/webhook/mtn
MTN_WEBHOOK_SECRET=<paste webhook secret you generated>

# ────────────────────────────────────
# PAYMENT: AIRTEL MONEY (Optional)
# ────────────────────────────────────
AIRTEL_MONEY_CLIENT_ID=<your client id>
AIRTEL_MONEY_CLIENT_SECRET=<your client secret>
AIRTEL_MONEY_ENVIRONMENT=production
AIRTEL_WEBHOOK_URL=https://api.transconnect.app/api/payments/webhook/airtel
AIRTEL_WEBHOOK_SECRET=<paste webhook secret you generated>

# ────────────────────────────────────
# EMAIL: TITAN SMTP
# ────────────────────────────────────
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@transconnect.app
EMAIL_PASS=<your titan email password>
EMAIL_FROM=TransConnect <noreply@transconnect.app>

# ────────────────────────────────────
# SMS: eSMS UGANDA
# ────────────────────────────────────
SMS_PROVIDER=esms
ESMS_API_KEY=<your esms api key>
ESMS_USERNAME=2057
ESMS_SENDER_ID=TransConnect
ESMS_ENVIRONMENT=production

# Fallback: Keep Twilio as backup
TWILIO_ACCOUNT_SID=<your existing twilio sid>
TWILIO_AUTH_TOKEN=<your existing twilio token>
TWILIO_PHONE_NUMBER=<your existing twilio number>

# ────────────────────────────────────
# NOTIFICATIONS
# ────────────────────────────────────
FIREBASE_PROJECT_ID=<your firebase project id>
FIREBASE_CLIENT_EMAIL=<your firebase client email>
FIREBASE_PRIVATE_KEY=<your firebase private key>
```

#### 2.3 Click **Save Changes**
- Render will automatically redeploy your backend
- Wait for deployment to complete (~5 minutes)
- Check logs for any errors

---

### Step 3: Get Payment Provider Credentials (1-2 hours)

#### 3.1 PesaPal (Primary - REQUIRED)

1. **Sign Up**
   - Go to: https://pay.pesapal.com
   - Click **Register** → **Business Account**
   - Fill in TransConnect business details
   
2. **Get Credentials**
   - Login to dashboard
   - Go to **API Settings**
   - Copy **Consumer Key** and **Consumer Secret**
   - Select **Production** environment
   
3. **Configure IPN (Instant Payment Notification)**
   - IPN URL: `https://api.transconnect.app/api/payments/ipn/pesapal`
   - Save configuration
   
4. **Update Render**
   - Add credentials to environment variables
   - Set `PAYMENT_DEMO_MODE=false`
   - Save and redeploy

#### 3.2 MTN Mobile Money (Optional but Recommended)

1. **Sign Up**
   - Go to: https://momodeveloper.mtn.com
   - Create developer account
   - Subscribe to **Collection** product
   
2. **Get Credentials**
   - Generate API User and API Key
   - Get Primary Subscription Key
   - Copy all credentials
   
3. **Test in Sandbox First**
   - Use sandbox environment
   - Test with test phone numbers
   - Verify webhook callbacks work
   
4. **Apply for Production**
   - Submit business documents
   - Wait for approval (1-2 weeks)
   - Get production credentials

#### 3.3 Airtel Money (Optional)

1. **Sign Up**
   - Go to: https://developers.airtel.africa
   - Register business account
   
2. **Get Credentials**
   - Apply for API access
   - Get Client ID and Client Secret
   
3. **Configure Webhook**
   - Webhook URL: `https://api.transconnect.app/api/payments/webhook/airtel`
   - Add webhook secret to environment

---

### Step 4: Submit Mobile App to Play Store (2 hours)

#### 4.1 Download App Bundle
- Go to: https://expo.dev/artifacts/eas/cCD5pGXQWm3fofEcXyAp6T.aab
- Download the AAB file (v1.0.10)
- Save as: `transconnect-v1.0.10-production.aab`

#### 4.2 Upload to Play Console

1. **Go to Google Play Console**
   - https://play.google.com/console
   - Select **TransConnect** app
   
2. **Navigate to Production**
   - Left sidebar: **Production**
   - Click **Create new release**
   
3. **Upload App Bundle**
   - Click **Upload** button
   - Select `transconnect-v1.0.10-production.aab`
   - Wait for processing (~2 minutes)
   
4. **Release Notes**
   ```
   🎉 TransConnect v1.0.10 - Production Ready!
   
   ✨ What's New:
   • Complete booking system with seat selection
   • Secure payment integration (PesaPal, Mobile Money)
   • QR code ticketing for easy check-in
   • Real-time bus schedules and availability
   • Push notifications for booking updates
   • Offline ticket access
   
   🚀 Ready to revolutionize bus travel in Uganda!
   ```
   
5. **Select Countries/Regions**
   - Start with: **Uganda** (primary market)
   - Optional: Kenya, Tanzania, Rwanda (expand later)
   - Click **Add countries**
   
6. **Configure Rollout**
   - Release type: **Staged rollout**
   - Percentage: **20%** (start small)
   - Click **Save**
   
7. **Review and Submit**
   - Review all information
   - Click **Review release**
   - Click **Start rollout to Production**

#### 4.3 Wait for Google Review
- **Timeline**: 1-7 days
- **Check Status**: Play Console dashboard
- **Be Ready**: Respond quickly if Google requests changes

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

### Verify Backend is Running

```powershell
# Test health check
Invoke-WebRequest -Uri "https://transconnect-app-44ie.onrender.com/health"

# Test API endpoint
Invoke-WebRequest -Uri "https://transconnect-app-44ie.onrender.com/api/routes"
```

Expected response: `200 OK` with data

### Verify Database Connection

```powershell
# Check database migrations
cd transconnect-backend
npx prisma migrate status
```

Expected: All migrations applied

### Test Authentication

```powershell
# Register test user via API
$body = @{
    email = "test@transconnect.app"
    password = "Test123456"
    name = "Test User"
    phone = "+256700000000"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://transconnect-app-44ie.onrender.com/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

Expected: `201 Created` with JWT token

### Test Payment Flow

1. **Open Web Portal**: https://transconnect.app
2. **Search Route**: Kampala → Gulu
3. **Select Seats**: Choose 2 seats
4. **Proceed to Payment**: Click Pay
5. **Complete Payment**: Use PesaPal test card
6. **Verify Booking**: Check booking confirmation
7. **Check Email**: Verify ticket email received
8. **Check SMS**: Verify SMS notification received

---

## 🎯 **SUCCESS METRICS**

After deployment, monitor these:

### Immediate (First 24 Hours)
- [ ] Backend responds to health checks
- [ ] Database migrations applied
- [ ] Users can register/login
- [ ] Routes are searchable
- [ ] Bookings can be created
- [ ] Payments are processing
- [ ] QR codes are generated
- [ ] Emails are sending
- [ ] SMS notifications work

### First Week
- [ ] 50+ app downloads
- [ ] 20+ successful bookings
- [ ] 10+ payment transactions
- [ ] <1% error rate
- [ ] <500ms API response time
- [ ] 99.9% uptime

### First Month
- [ ] 500+ app downloads
- [ ] 200+ bookings
- [ ] $1,000+ in ticket sales
- [ ] 4.0+ app store rating
- [ ] 5+ bus operators onboarded
- [ ] Positive user feedback

---

## 🚨 **TROUBLESHOOTING**

### Backend Won't Start

```powershell
# Check Render logs
# Dashboard → transconnect-app → Logs

# Common issues:
# 1. Database URL not set → Add DATABASE_URL
# 2. Port binding error → Ensure HOST=0.0.0.0
# 3. Missing dependencies → Check package.json
```

### Payments Not Working

```bash
# Check payment environment:
PAYMENT_DEMO_MODE=false  # Must be false
PESAPAL_ENVIRONMENT=production  # Not sandbox

# Verify webhook URL is accessible:
curl https://api.transconnect.app/api/payments/ipn/pesapal
```

### Emails Not Sending

```bash
# Verify SMTP settings:
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587  # NOT 465
EMAIL_SECURE=false  # Must be false for port 587
EMAIL_USER=noreply@transconnect.app
```

### Mobile App Can't Connect

```bash
# Check mobile .env:
EXPO_PUBLIC_API_URL=https://transconnect-app-44ie.onrender.com/api

# Test from mobile:
# Open browser on phone
# Visit: https://transconnect-app-44ie.onrender.com/health
# Should return OK
```

---

## 📞 **SUPPORT RESOURCES**

### Service Provider Support

| Provider | Support URL | Response Time |
|----------|------------|---------------|
| Render | https://render.com/support | 24-48 hours |
| PesaPal | support@pesapal.com | 24 hours |
| MTN MoMo | momodeveloper@mtn.com | 48 hours |
| Airtel | developers@airtel.africa | 48 hours |
| Titan Email | https://titan.email/support | 12-24 hours |
| eSMS Uganda | support@esms.ug | 24 hours |

### Emergency Contacts

If production goes down:
1. Check Render status page
2. View application logs
3. Roll back to previous deployment
4. Contact 3B Solutions technical team

---

## 🎉 **POST-LAUNCH TASKS**

### Week 1
- [ ] Monitor error logs daily
- [ ] Track user registrations
- [ ] Monitor payment success rate
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately

### Week 2
- [ ] Analyze booking patterns
- [ ] Identify popular routes
- [ ] Optimize slow queries
- [ ] Increase Play Store rollout to 50%

### Week 3-4
- [ ] Add more bus operators
- [ ] Expand to 100% Play Store rollout
- [ ] Plan marketing campaign
- [ ] Gather operator feedback
- [ ] Plan v1.1 features

---

## 🚀 **YOU'RE READY TO LAUNCH!**

With these steps complete, TransConnect will be live and serving real users. 

**Estimated total time: 4-6 hours of focused work**

Key success factors:
✅ All services configured correctly  
✅ Payments working end-to-end  
✅ Mobile app approved by Google  
✅ Monitoring in place  
✅ Support channels ready

**Let's revolutionize bus travel in Uganda! 🇺🇬**

---

*Last Updated: June 29, 2026*  
*For questions: dev@transconnect.app*
