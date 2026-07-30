# Pre-Play Store Testing Checklist
## Version: 1.0.20 (UPDATED - OTP Navigation Fixed)
## Date: July 29, 2026

## Test APK Download
📦 **APK v1.0.20:** Building now - URL will be updated

## ⚠️ FIXES APPLIED SINCE LAST TEST:
1. **✅ FIXED:** Email OTP navigation - now goes directly to verification screen after signup
2. **ℹ️ PHONE OTP:** Backend endpoints exist and work, but SMS delivery requires configuration

---

## Critical Features Testing

### 1. ✅ OTP Email Verification (NEW FEATURE)
**Priority:** CRITICAL - This is the main feature you wanted to verify

#### Test Steps:
1. Open the app and tap "Create Account"
2. Fill in registration form:
   - First Name
   - Last Name
   - Email address (use a real email you can access)
   - Phone number
   - Password (min 8 characters)
3. Tap "Sign Up" button
4. **Expected:** Alert appears: "Verify Your Email - We sent a 6-digit code to your email. Enter it to activate your account."
5. Tap "Continue"
6. **Expected:** Email Verification screen appears
7. Check your email inbox for verification code
8. **Expected:** Email received with 6-digit OTP code
9. Enter the 6-digit code in the app
10. Tap "Verify Email"
11. **Expected:** Success alert "Email verified successfully. You are now logged in."
12. **Expected:** Automatically logged in and redirected to Home screen

#### Additional OTP Tests:
- **Test Resend OTP:** 
  - Wait 60 seconds on verification screen
  - Tap "Resend Code"
  - Check if new code received via email
- **Test Invalid Code:**
  - Enter wrong 6-digit code
  - Verify error message appears
- **Test Masked Email:**
  - Verify email is displayed as "em***@domain.com" on verification screen

**Status:** ⬜ PASS / ⬜ FAIL  
**Notes:**
```


```

---

### 2. ✅ PesaPal Payment Flow (FIXED)
**Priority:** CRITICAL - Previously was auto-completing without checkout

#### Test Steps:
1. Log in to the app
2. Search for a route (e.g., Kampala to Entebbe)
3. Select a route and date
4. Select seat(s)
5. Review booking details
6. Tap "Continue to Payment"
7. Select payment method: "PesaPal"
8. Tap "Pay with PesaPal"
9. **Expected:** PesaPal WebView checkout page opens (NOT auto-success)
10. **Expected:** Shows PesaPal payment form with amount
11. Choose a payment method (MTN Mobile Money, Airtel Money, Card, etc.)
12. Complete payment process
13. **Expected:** After payment, redirected to success callback
14. **Expected:** Booking confirmed with QR code
15. **Expected:** Email notification sent (if SMTP working)

#### Additional Payment Tests:
- **Test Payment Cancellation:**
  - Start payment flow
  - Click "Cancel" or back button in PesaPal WebView
  - **Expected:** Alert "Payment Cancelled - Your payment was cancelled. Please try again."
  - **Expected:** Booking remains in PENDING status
  - This leads to Test #3 (Payment Retry)

**Status:** ⬜ PASS / ⬜ FAIL  
**Notes:**
```


```

---

### 3. ✅ Payment Retry - "Pay Now" Button (NEW FEATURE)
**Priority:** CRITICAL - Fixes regression where cancelled payments had no retry option

#### Test Steps:
1. Create a booking and cancel the PesaPal payment (as in Test #2 cancellation)
2. Navigate to "Bookings" tab
3. Find the booking with "Payment Pending" indicator (red warning icon)
4. **Expected:** "Pay Now" button visible on unpaid booking
5. Tap "Pay Now"
6. **Expected:** Navigated to Payment screen with booking details pre-filled
7. **Expected:** Payment screen title shows "Complete Payment"
8. Select payment method and complete payment
9. **Expected:** Booking status updates to CONFIRMED
10. **Expected:** QR code generated
11. Go back to Bookings tab
12. **Expected:** "Pay Now" button no longer visible on this booking
13. **Expected:** "View Ticket" and "Transfer Ticket" buttons now visible

**Status:** ⬜ PASS / ⬜ FAIL  
**Notes:**
```


```

---

### 4. ✅ QR Code Verification (VERIFIED CORRECT)
**Priority:** HIGH - Ensure correct booking data in QR code

#### Test Steps:
1. Complete a booking with payment
2. View the booking confirmation screen
3. **Expected:** QR code displayed
4. Tap on QR code to view details
5. **Verify QR code contains:**
   - Booking ID
   - Seat number(s)
   - Route name (origin to destination)
   - Travel date
   - Payment reference
6. **NOT in QR code:** Route selection data (this was the concern)
7. Optional: Scan QR code with operator QR scanner to verify data

**Status:** ⬜ PASS / ⬜ FAIL  
**Notes:**
```


```

---

### 5. ✅ Route Search (FIXED)
**Priority:** HIGH - Routes must appear in search

#### Test Steps:
1. Go to Home/Search screen
2. Enter search criteria:
   - From: Any city (e.g., "Kampala")
   - To: Any city (e.g., "Entebbe")
   - Date: Today or future date
3. Tap "Search"
4. **Expected:** List of available routes appears
5. **Expected:** Routes show bus operator, price, departure time, arrival time
6. Try different search combinations:
   - Popular routes (Kampala-Entebbe, Kampala-Jinja)
   - Less common routes
   - Single location search (only origin OR only destination)
7. **Expected:** At least 59 active routes available in system

**Status:** ⬜ PASS / ⬜ FAIL  
**Notes:**
```


```

---

### 6. ⏳ Email Notifications (REQUIRES BACKEND TEST)
**Priority:** HIGH - User communication depends on this

#### Test Steps:
1. Complete a new booking with payment
2. Check email inbox for:
   - **Booking confirmation email**
   - **Payment confirmation email**
3. If emails NOT received, check backend logs:

```powershell
# SSH to VPS
ssh root@178.128.102.164

# Check backend logs for email/SMTP activity
docker logs -f tc_backend_prod | grep -i "email\|smtp\|nodemailer"
```

4. Verify SMTP configuration in VPS:
```bash
# Check environment variables
cat /opt/transconnect/production/.env | grep SMTP
```

5. **Expected SMTP config:**
   - SMTP_HOST=smtp.titan.email
   - SMTP_PORT=465
   - SMTP_SECURE="true" (with quotes)
   - SMTP_USER=transconnect@omande.net
   - SMTP_PASS=[password]

**Status:** ⬜ PASS / ⬜ FAIL  
**Notes:**
```


```

---

## Additional Feature Tests

### 7. ✅ Authentication Flow
- [ ] Login with existing account
- [ ] Logout
- [ ] Password reset (if implemented)
- [ ] Session persistence (close app, reopen - should stay logged in)

### 8. ✅ Booking Management
- [ ] View all bookings
- [ ] Filter bookings by status (Upcoming, Past, Cancelled)
- [ ] View ticket details
- [ ] Ticket transfer (if implemented)

### 9. ✅ Profile Management
- [ ] View profile
- [ ] Edit profile details
- [ ] Upload profile picture (if implemented)

### 10. ✅ UI/UX Checks
- [ ] App loads without crashes
- [ ] All screens render correctly
- [ ] Navigation works smoothly
- [ ] No broken images or icons
- [ ] Colors and branding consistent
- [ ] Text readable on all screens

---

## Bug Tracking

### Issues Found During Testing:
1. **Issue:** 
   **Severity:** 
   **Steps to Reproduce:**
   
   **Expected:**
   
   **Actual:**
   

2. **Issue:** 
   **Severity:** 
   **Steps to Reproduce:**
   
   **Expected:**
   
   **Actual:**
   

---

## Final Sign-Off

### All Critical Tests Passed: ⬜ YES / ⬜ NO

**If YES:** Proceed to build production AAB:
```bash
cd C:\Users\DELL\mobility-app\transconnect-mobile
eas build --profile production --platform android
```

**If NO:** Document issues above and fix before Play Store submission.

---

## Testing Team
- **Tester Name:**
- **Test Date:**
- **Test Duration:**
- **Device Used:**
- **Android Version:**

---

## Notes & Observations
```


```
