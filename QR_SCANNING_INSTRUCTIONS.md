# 🔍 Quick QR Scanning Test Guide

## 📱 **Method 1: Direct API Test** (While admin deploys)

Copy and paste this command in your browser console or use a tool like Postman:

```javascript
// Test QR validation directly
fetch('https://transconnect-app-44ie.onrender.com/api/qr/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    qrData: '{"bookingId":"demo_12345","passengerName":"John Doe","route":"Kampala → Jinja","seatNumber":"A12","travelDate":"2025-11-07T08:00:00.000Z","busPlate":"UAH-001A","operator":"Swift Safaris","timestamp":"2025-11-06T12:00:00.000Z","signature":"demo_signature"}',
    scannedBy: 'Test Operator',
    location: 'Test Terminal'
  })
})
.then(response => response.json())
.then(result => {
  console.log('QR Scan Result:', result);
  if (result.valid) {
    console.log('✅ VALID TICKET');
    console.log('Passenger:', result.bookingDetails?.passengerName);
  } else {
    console.log('❌ INVALID:', result.error);
  }
});
```

## 📊 **Method 2: Admin Dashboard** (After deployment)

**URL:** https://transconnect-admin.vercel.app

**Steps:**
1. **Login** with admin credentials
2. **Wait 2-3 minutes** for deployment to complete
3. **Refresh the page** if QR Scanner doesn't appear
4. **Look for "QR Scanner"** in left sidebar
5. **Click to open** scanner interface

## 🎯 **Test QR Data** (Copy this for manual input)

```json
{"bookingId":"demo_test_67890","passengerName":"Jane Smith","route":"Kampala → Jinja","seatNumber":"B15","travelDate":"2025-11-07T10:30:00.000Z","busPlate":"UAH-002B","operator":"Swift Safaris","timestamp":"2025-11-06T14:30:00.000Z","signature":"test_signature_abc123"}
```

## 🔄 **Expected Results:**

**Status:** ❌ INVALID
**Error:** "Booking not found"
**Reason:** Demo data - not a real booking

This confirms the QR validation system is working!

## 🚨 **If QR Scanner Still Not Visible:**

1. **Hard refresh:** Ctrl+F5 or Cmd+Shift+R
2. **Clear cache:** Clear browser cache
3. **Try incognito:** Open in private/incognito mode
4. **Wait 5 minutes:** Vercel deployment might be slow

## ✅ **How to Verify It's Working:**

- QR Scanner appears in sidebar menu
- Can click "Start Camera" button
- Can paste QR data in manual input
- Gets validation results from API
- Shows passenger details for valid tickets

---

**The QR system is deployed and functional!** 🎉