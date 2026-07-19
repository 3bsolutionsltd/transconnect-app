# 🔄 TransConnect - Environment Configuration Gap Analysis
**Date**: June 29, 2026  
**Purpose**: Compare current vs. production configuration  
**Action Required**: Update Render environment variables

---

## 📊 **CONFIGURATION COMPARISON**

| Variable | Current Value | Production Value | Status | Priority |
|----------|---------------|------------------|--------|----------|
| `NODE_ENV` | production | production | ✅ OK | - |
| `PORT` | 5000 | 5000 | ✅ OK | - |
| `HOST` | 0.0.0.0 | 0.0.0.0 | ✅ OK | - |
| `JWT_SECRET` | <existing> | <64-byte hex> | ⚠️ UPDATE | 🔴 HIGH |
| `JWT_EXPIRES_IN` | 30d | 7d | ⚠️ UPDATE | 🔴 HIGH |
| `CORS_ORIGIN` | <limited> | full list | ⚠️ UPDATE | 🟡 MEDIUM |
| `PAYMENT_DEMO_MODE` | true | false | ⚠️ UPDATE | 🔴 CRITICAL |
| `PESAPAL_CONSUMER_KEY` | sandbox | production | ⚠️ MISSING | 🔴 CRITICAL |
| `PESAPAL_CONSUMER_SECRET` | sandbox | production | ⚠️ MISSING | 🔴 CRITICAL |
| `PESAPAL_ENVIRONMENT` | sandbox | production | ⚠️ UPDATE | 🔴 CRITICAL |
| `EMAIL_PORT` | 465 | 587 | ⚠️ UPDATE | 🟠 HIGH |
| `EMAIL_USER` | transconnect@omande.net | noreply@transconnect.app | ⚠️ UPDATE | 🟠 HIGH |
| `MTN_MOMO_*` | Not set | <credentials> | ⚠️ MISSING | 🟡 OPTIONAL |
| `AIRTEL_MONEY_*` | Not set | <credentials> | ⚠️ MISSING | 🟡 OPTIONAL |
| `ESMS_*` | Not set | <credentials> | ⚠️ MISSING | 🟡 MEDIUM |

---

## 🔴 **CRITICAL UPDATES NEEDED**

### 1. JWT Security Enhancement

**Current Configuration:**
```bash
JWT_SECRET=<shorter secret>
JWT_EXPIRES_IN=30d
```

**Production Configuration:**
```bash
JWT_SECRET=<run: openssl rand -hex 64>  # 512-bit security
JWT_EXPIRES_IN=7d  # Better security, force re-auth weekly
```

**Why Change:**
- Longer secret = stronger encryption
- Shorter expiry = reduced security risk if token leaked
- Industry best practice: 7-14 days for mobile apps

**Action:**
```powershell
# Generate new secret
openssl rand -hex 64

# Copy output and update in Render
```

---

### 2. Payment Gateway - Move to Production

**Current Configuration:**
```bash
PAYMENT_DEMO_MODE=true
PESAPAL_CONSUMER_KEY=<sandbox key>
PESAPAL_CONSUMER_SECRET=<sandbox secret>
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_IPN_URL=<sandbox url>
```

**Production Configuration:**
```bash
PAYMENT_DEMO_MODE=false
PESAPAL_CONSUMER_KEY=<production key from pay.pesapal.com>
PESAPAL_CONSUMER_SECRET=<production secret from pay.pesapal.com>
PESAPAL_ENVIRONMENT=production
PESAPAL_IPN_URL=https://api.transconnect.app/api/payments/ipn/pesapal
```

**Why Change:**
- Cannot process real money in sandbox mode
- Production credentials required for actual payments
- Webhook URL must be publicly accessible

**Action:**
1. Sign up at https://pay.pesapal.com
2. Verify business account
3. Get production credentials from dashboard
4. Configure IPN URL in PesaPal dashboard
5. Update Render environment variables

---

### 3. CORS Configuration Enhancement

**Current Configuration:**
```bash
CORS_ORIGIN=https://transconnect.app
```

**Production Configuration:**
```bash
CORS_ORIGIN=https://transconnect.app,https://www.transconnect.app,https://admin.transconnect.app
```

**Why Change:**
- Admin dashboard needs API access
- Support both www and non-www variants
- Prevent CORS errors for legitimate requests

**Action:**
- Update single variable in Render
- No external signup needed

---

## 🟠 **HIGH PRIORITY UPDATES**

### 4. Email Configuration Update

**Current Configuration:**
```bash
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=transconnect@omande.net
EMAIL_PASS=<current password>
EMAIL_FROM=TransConnect <transconnect@omande.net>
```

**Production Configuration:**
```bash
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@transconnect.app
EMAIL_PASS=<new password for noreply account>
EMAIL_FROM=TransConnect <noreply@transconnect.app>
```

**Why Change:**
- Port 587 (STARTTLS) more reliable than 465 (SSL)
- Professional noreply@ address
- Aligns with email best practices
- Better deliverability

**Action:**
1. Create noreply@transconnect.app email in Titan
2. Get password for new account
3. Update Render environment variables

---

### 5. API URL Configuration

**Current Configuration:**
```bash
API_URL=<not set or points to Render URL>
FRONTEND_URL=https://transconnect.app
ADMIN_URL=https://admin.transconnect.app
```

**Production Configuration:**
```bash
API_URL=https://api.transconnect.app
FRONTEND_URL=https://transconnect.app
ADMIN_URL=https://admin.transconnect.app
```

**Why Change:**
- Clean, branded API domain
- Easier to remember and document
- Professional appearance

**Action:**
1. Add CNAME record: api.transconnect.app → <render-url>
2. Update Render custom domain
3. Update environment variable

---

## 🟡 **OPTIONAL BUT RECOMMENDED**

### 6. MTN Mobile Money Integration

**Current Configuration:**
```bash
# Not configured
```

**Production Configuration:**
```bash
MTN_MOMO_SUBSCRIPTION_KEY=<your subscription key>
MTN_MOMO_USER_ID=<your user id>
MTN_MOMO_API_KEY=<your api key>
MTN_MOMO_ENVIRONMENT=production
MTN_WEBHOOK_URL=https://api.transconnect.app/api/payments/webhook/mtn
MTN_WEBHOOK_SECRET=<run: openssl rand -hex 32>
```

**Why Add:**
- Most popular payment method in Uganda
- Increase conversion rate
- Users prefer mobile money over cards

**Timeline:**
- Signup: 1 hour
- Sandbox testing: 1 day
- Production approval: 1-2 weeks

**Action:**
1. Sign up at https://momodeveloper.mtn.com
2. Subscribe to Collections product
3. Test in sandbox first
4. Apply for production access
5. Update environment when approved

---

### 7. Airtel Money Integration

**Current Configuration:**
```bash
# Not configured
```

**Production Configuration:**
```bash
AIRTEL_MONEY_CLIENT_ID=<your client id>
AIRTEL_MONEY_CLIENT_SECRET=<your client secret>
AIRTEL_MONEY_ENVIRONMENT=production
AIRTEL_WEBHOOK_URL=https://api.transconnect.app/api/payments/webhook/airtel
AIRTEL_WEBHOOK_SECRET=<run: openssl rand -hex 32>
```

**Why Add:**
- Second most popular mobile money in Uganda
- Serve Airtel subscribers
- Backup payment method

**Timeline:**
- Similar to MTN (1-2 weeks approval)

**Action:**
1. Sign up at https://developers.airtel.africa
2. Apply for API access
3. Test in sandbox
4. Update environment when approved

---

### 8. eSMS Uganda for SMS Notifications

**Current Configuration:**
```bash
# Using Twilio (expensive for Uganda)
TWILIO_ACCOUNT_SID=<existing>
TWILIO_AUTH_TOKEN=<existing>
TWILIO_PHONE_NUMBER=+17278882590
```

**Production Configuration:**
```bash
# Primary: eSMS Uganda (80% cheaper)
SMS_PROVIDER=esms
ESMS_API_KEY=<your api key>
ESMS_USERNAME=2057
ESMS_SENDER_ID=TransConnect
ESMS_ENVIRONMENT=production

# Fallback: Keep Twilio
TWILIO_ACCOUNT_SID=<existing>
TWILIO_AUTH_TOKEN=<existing>
TWILIO_PHONE_NUMBER=<existing>
```

**Why Add:**
- 80% cheaper for Ugandan phone numbers
- Better delivery rates locally
- Support for custom sender ID
- Can keep Twilio as fallback

**Action:**
1. Sign up at https://esms.ug
2. Get API credentials
3. Configure sender ID: "TransConnect"
4. Update backend to try eSMS first, fallback to Twilio

---

## 🔐 **NEW SECRETS TO GENERATE**

Before updating Render, generate these secrets:

```powershell
# 1. JWT Secret (512-bit)
openssl rand -hex 64

# 2. MTN Webhook Secret
openssl rand -hex 32

# 3. Airtel Webhook Secret  
openssl rand -hex 32

# 4. Database Password (if creating new DB)
openssl rand -base64 32

# 5. Redis Password (if adding Redis)
openssl rand -base64 32
```

**Save these securely!** You'll need them when updating environment variables.

---

## 📋 **STEP-BY-STEP UPDATE PROCESS**

### Phase 1: Immediate Updates (Can do now)

1. **Generate Secrets**
   ```powershell
   $jwt = openssl rand -hex 64
   $mtn = openssl rand -hex 32
   $airtel = openssl rand -hex 32
   
   # Save to secure location
   ```

2. **Update Render Dashboard**
   - Login to https://dashboard.render.com
   - Select `transconnect-app` service
   - Go to Environment tab
   - Update these variables:
     - `JWT_SECRET` → new 64-byte value
     - `JWT_EXPIRES_IN` → `7d`
     - `CORS_ORIGIN` → full list
   - Click **Save**

3. **Wait for Redeploy**
   - Render automatically redeploys
   - Check logs for errors
   - Test health endpoint

### Phase 2: Payment Setup (1-2 hours signup)

4. **Sign up for PesaPal Production**
   - Go to https://pay.pesapal.com
   - Register business account
   - Verify identity
   - Get credentials

5. **Configure PesaPal**
   - In PesaPal dashboard:
     - Set IPN URL: `https://api.transconnect.app/api/payments/ipn/pesapal`
     - Enable production environment
   - In Render:
     - Update `PESAPAL_CONSUMER_KEY`
     - Update `PESAPAL_CONSUMER_SECRET`
     - Set `PESAPAL_ENVIRONMENT=production`
     - Set `PAYMENT_DEMO_MODE=false`
   - Click **Save** and redeploy

6. **Test Payment Flow**
   - Open web portal
   - Create test booking
   - Complete payment with real card (small amount)
   - Verify booking confirmation
   - Check database for payment record

### Phase 3: Email & SMS (1-2 hours)

7. **Set up noreply@transconnect.app**
   - Login to Titan email
   - Create new mailbox: noreply@transconnect.app
   - Generate strong password
   - Test SMTP connection

8. **Update Email Settings**
   - In Render:
     - Update `EMAIL_PORT` → `587`
     - Update `EMAIL_SECURE` → `false`
     - Update `EMAIL_USER` → `noreply@transconnect.app`
     - Update `EMAIL_PASS` → new password
   - Click **Save** and redeploy
   - Test by triggering password reset email

9. **Set up eSMS Uganda** (Optional)
   - Sign up at https://esms.ug
   - Get API key and username (2057)
   - Configure sender ID: TransConnect
   - Add to Render environment
   - Test SMS sending

### Phase 4: Mobile Money (Optional, 1-2 weeks timeline)

10. **Apply for MTN MoMo**
    - Sign up at https://momodeveloper.mtn.com
    - Subscribe to Collections
    - Test in sandbox
    - Submit business documents for production
    - Wait for approval
    - Update environment when approved

11. **Apply for Airtel Money**
    - Sign up at https://developers.airtel.africa
    - Apply for API access
    - Test in sandbox
    - Submit for production approval
    - Update environment when approved

---

## ✅ **VERIFICATION CHECKLIST**

After each phase, verify:

### After Phase 1 (Immediate Updates)
- [ ] Backend redeployed successfully
- [ ] Health check returns 200 OK
- [ ] Users can login (JWT working)
- [ ] Token expiry is 7 days (check response)
- [ ] CORS allows admin.transconnect.app

### After Phase 2 (Payment Setup)
- [ ] `PAYMENT_DEMO_MODE=false` in environment
- [ ] PesaPal production credentials set
- [ ] Test booking with real payment succeeds
- [ ] Payment callback received
- [ ] Database payment record created
- [ ] User receives booking confirmation

### After Phase 3 (Email & SMS)
- [ ] Emails send from noreply@transconnect.app
- [ ] SMTP connection successful
- [ ] Test email delivered to inbox (not spam)
- [ ] SMS sent successfully (if eSMS configured)
- [ ] SMS delivered to phone

### After Phase 4 (Mobile Money)
- [ ] MTN MoMo payment option appears
- [ ] Airtel Money payment option appears
- [ ] Test payment with MTN succeeds
- [ ] Test payment with Airtel succeeds
- [ ] Webhooks trigger correctly

---

## 🚨 **ROLLBACK PLAN**

If production deployment causes issues:

1. **Immediate Rollback**
   ```
   Render Dashboard → transconnect-app → Deploy → Previous Deploy
   ```

2. **Revert Environment Variables**
   - Keep old values saved in a file
   - Can restore quickly if needed

3. **Common Issues & Fixes**

   **Issue**: JWT tokens not working
   ```bash
   # Check JWT_SECRET is set
   # Verify JWT_EXPIRES_IN format (e.g., "7d" not "7")
   # Users may need to re-login
   ```

   **Issue**: Payments failing
   ```bash
   # Verify PAYMENT_DEMO_MODE=false
   # Check PESAPAL_ENVIRONMENT=production
   # Confirm IPN URL is correct
   # Check PesaPal dashboard for errors
   ```

   **Issue**: Emails not sending
   ```bash
   # Verify EMAIL_PORT=587 (not 465)
   # Check EMAIL_SECURE=false (for port 587)
   # Confirm SMTP credentials correct
   # Test with curl or Postman
   ```

---

## 📊 **IMPACT ASSESSMENT**

| Update | Impact | Downtime | Risk |
|--------|--------|----------|------|
| JWT Secret Change | High | None | Low - Users re-login |
| JWT Expiry Change | Medium | None | Low - Gradual effect |
| CORS Update | Low | None | Very Low |
| Payment → Production | High | None | Medium - Test thoroughly |
| Email Config | Medium | None | Low - Falls back to old |
| SMS Provider | Low | None | Low - Optional feature |

**Overall Risk**: 🟡 MEDIUM

**Mitigation**: 
- Test each change in staging first (if available)
- Update during low-traffic hours
- Have rollback plan ready
- Monitor logs closely after deployment

---

## 🎯 **RECOMMENDED SEQUENCE**

**Week 1 (Critical Path)**
1. Day 1: Generate secrets + Update JWT + CORS
2. Day 2: Sign up for PesaPal production
3. Day 3: Get PesaPal credentials + Update environment
4. Day 4: Test payment flow thoroughly
5. Day 5: Set up noreply email + Update config

**Week 2 (Enhancements)**
6. Day 8: Apply for MTN MoMo production
7. Day 9: Apply for Airtel Money production
8. Day 10: Set up eSMS Uganda
9. Day 11: Test all SMS delivery
10. Day 12: Configure api.transconnect.app domain

**Week 3-4 (Waiting for Approvals)**
- Monitor MTN MoMo application status
- Monitor Airtel Money application status
- Add mobile money options when approved

---

## 📞 **SUPPORT CONTACTS**

If you encounter issues during updates:

| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| Render Deployment | https://render.com/support | 24-48 hours |
| PesaPal Integration | support@pesapal.com | 24 hours |
| Titan Email | https://titan.email/support | 12-24 hours |
| MTN MoMo | momodeveloper@mtn.com | 48 hours |
| Airtel Money | developers@airtel.africa | 48 hours |
| eSMS Uganda | support@esms.ug | 24 hours |

---

## 🎉 **AFTER UPDATES COMPLETE**

Once all environment variables are updated:

✅ Backend running with production configuration  
✅ Payments processing real transactions  
✅ Emails sending from branded address  
✅ SMS notifications working (optional)  
✅ Mobile money integrated (optional)  

**You'll be 100% production ready! 🚀**

---

*Last Updated: June 29, 2026*  
*Next: Follow PRODUCTION_DEPLOYMENT_STEPS.md for complete launch sequence*
