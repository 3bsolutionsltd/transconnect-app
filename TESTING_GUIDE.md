# 🚀 Quick Start - Testing Critical Fixes

## Windows Testing Guide

### Prerequisites
- ✅ Node.js installed
- ✅ All dependencies installed (`npm install` in each folder)
- ✅ PostgreSQL database running

---

## Step 1: Start the Backend

**Option A - PowerShell Script (Recommended):**
```powershell
cd C:\Users\DELL\mobility-app
.\start-backend.ps1
```

**Option B - Manual:**
```powershell
cd C:\Users\DELL\mobility-app\transconnect-backend
npm run dev
```

**Expected Output:**
```
✓ Database connected
✓ Server running on port 5000
✓ API available at http://localhost:5000
```

---

## Step 2: Start Admin Dashboard (New Terminal)

```powershell
cd C:\Users\DELL\mobility-app\transconnect-admin
npm start
```

**Opens at:** http://localhost:3001

---

## Step 3: Start Mobile App (New Terminal)

```powershell
cd C:\Users\DELL\mobility-app\transconnect-mobile
npx expo start
```

**Then press:**
- `a` for Android emulator
- `i` for iOS simulator
- Or scan QR code with Expo Go app

---

## Step 4: Run Tests

**PowerShell Test Script:**
```powershell
cd C:\Users\DELL\mobility-app
.\test-fixes.ps1
```

---

## 🧪 Manual Testing Checklist

### Test 1: QR Scanner Fix ✅
1. Open Admin Dashboard: http://localhost:3001
2. Login as operator (email: `operator@example.com`, password: `test123`)
3. Click **"QR Scanner"** in sidebar
4. Click **"Start Camera"** button

**Expected Results:**
- ✅ Camera starts and **stays active**
- ✅ Video stream remains visible
- ✅ Scanner doesn't stop immediately
- ✅ QR codes detected within 2-3 seconds

**Previous Issue:** Camera started and stopped in milliseconds

---

### Test 2: Payment Status Update Fix ✅

**Step 2a - Create Booking (Mobile App):**
1. Open mobile app
2. Search for a route
3. Select seats
4. Choose **"Cash/Over the Counter"** payment
5. Complete booking
6. **Verify:** Booking shows **"PENDING"** status

**Step 2b - Confirm Payment (Admin Dashboard):**
1. Open Admin Dashboard
2. Go to **"Pending Payments"**
3. Find the booking
4. Click **"Confirm Payment"**
5. Add note (optional)
6. Click **"Confirm"**

**Step 2c - Verify Update (Mobile App):**
1. Pull down to refresh bookings list
2. **Verify:** Status changed to **"CONFIRMED"**
3. **OR** wait 30 seconds for auto-refresh

**Expected Results:**
- ✅ Status updates within 30 seconds
- ✅ Manual refresh works immediately
- ✅ Booking shows CONFIRMED status
- ✅ QR code becomes available

**Previous Issue:** Status remained "PENDING" forever

---

### Test 3: Payment Notification Fix ✅

**During Step 2b above, also check:**

**Backend Console:**
```
✓ Payment confirmation notification sent to user [userId]
```

**Mobile App:**
- ✅ Push notification received
- ✅ Title: "Payment Confirmed!"
- ✅ Body mentions booking is now active
- ✅ Tapping notification refreshes bookings

**Email:**
- ✅ Email received at passenger's address
- ✅ Subject: "Payment Confirmed - [transactionId]"
- ✅ Body contains booking details

**Expected Results:**
- ✅ Multi-channel notifications sent
- ✅ Passenger informed immediately
- ✅ Notification includes booking status

**Previous Issue:** No notification sent at all

---

## 🔍 Troubleshooting

### Backend Won't Start
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Restart backend
cd transconnect-backend
npm run dev
```

### Admin Dashboard Issues
```powershell
# Clear cache and rebuild
cd transconnect-admin
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
npm install
npm start
```

### Mobile App Issues
```powershell
# Clear cache
cd transconnect-mobile
npx expo start -c
```

### QR Scanner Not Working
1. **Check browser permissions** - Allow camera access
2. **Use HTTPS** - Camera requires secure connection
3. **Try different browser** - Chrome/Edge recommended
4. **Check console** - Look for error messages

### Status Not Updating
1. **Check internet** - Mobile app needs connection
2. **Pull to refresh** - Manual refresh works immediately
3. **Wait 30 seconds** - Auto-refresh is enabled
4. **Check backend logs** - Verify payment was processed

---

## 📊 Success Criteria

### All Tests Pass When:
- ✅ QR scanner stays active for >10 seconds
- ✅ QR codes detected within 2-3 seconds
- ✅ Payment status updates within 30 seconds
- ✅ Notifications delivered successfully
- ✅ No console errors

---

## 📝 Test Results Template

Copy and fill this out:

```
TESTING RESULTS - [Date/Time]
================================

Test 1: QR Scanner
[ ] Camera starts successfully
[ ] Camera stays active (doesn't stop)
[ ] QR codes detected within 2-3 seconds
[ ] No errors in console
Status: PASS / FAIL
Notes: _______________________

Test 2: Payment Status
[ ] Booking created with PENDING status
[ ] Payment confirmed by operator
[ ] Status updated to CONFIRMED
[ ] Update occurred within 30 seconds
Status: PASS / FAIL
Notes: _______________________

Test 3: Notifications
[ ] Backend log shows notification sent
[ ] Push notification received on mobile
[ ] Email notification received
[ ] Notification content correct
Status: PASS / FAIL
Notes: _______________________

Overall Status: PASS / FAIL
Tester: _______________________
```

---

## 🎯 Next Steps After Testing

If all tests pass:
1. ✅ Document any findings
2. ✅ Deploy to staging
3. ✅ Run tests on staging
4. ✅ Deploy to production

If tests fail:
1. ❌ Document the failure
2. ❌ Check error messages
3. ❌ Review code changes
4. ❌ Contact support

---

## 📞 Support

**Technical Issues:**
- Review: `CRITICAL_FIXES_IMPLEMENTATION.md`
- Quick Help: `QUICK_FIX_REFERENCE.md`
- Email: tech@transconnect.app
- Phone: +256 39451710

---

**Last Updated:** December 31, 2025  
**Version:** 1.0  
**Status:** Ready for Testing ✅
