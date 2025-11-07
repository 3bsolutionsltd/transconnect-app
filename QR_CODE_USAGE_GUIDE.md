# 📱 How to Get QR Codes for Scanning

## 🎯 **The Complete QR Code Flow**

### **Step 1: Generate QR Codes (Passenger Process)**

**Option A: Through Web Booking Portal**
1. Go to: https://transconnect-web.vercel.app
2. Register/Login as a passenger
3. Search for routes (e.g., Kampala → Jinja)
4. Select a route and seat
5. Proceed to payment
6. Make payment (demo mode works)
7. **QR code appears on booking success page**

**Option B: Through Direct API Test**
```bash
# Test payment endpoint to generate QR
curl -X POST https://transconnect-app-44ie.onrender.com/api/payments/process \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "demo_test_123",
    "amount": 15000,
    "currency": "UGX", 
    "provider": "MTN",
    "phoneNumber": "+256701234567",
    "passengerName": "John Doe",
    "route": "Kampala → Jinja",
    "seatNumber": "A12",
    "travelDate": "2025-11-07T08:00:00.000Z",
    "busPlate": "UAH-001A",
    "operator": "Swift Safaris"
  }'
```

### **Step 2: Where to Find Generated QR Codes**

**QR codes appear in:**
1. **Booking Success Page** - After successful payment
2. **Email Confirmation** - Sent to passenger email (when email service is configured)
3. **Mobile App** - Will show QR tickets (when Flutter app is ready)
4. **API Response** - Payment completion returns QR code data

### **Step 3: Scan QR Codes (Operator Process)**

**Using Admin Dashboard:**
1. Go to: https://transconnect-admin.vercel.app
2. Login with admin credentials
3. Click **"QR Scanner"** in left sidebar
4. Use one of these methods:
   - **Camera**: Point at passenger's phone screen
   - **Upload**: Take photo of QR code and upload
   - **Manual**: Paste QR data if needed

## 🧪 **Testing the QR System**

### **Quick Test Method:**
1. **Generate QR**: Make a booking and payment on web portal
2. **Copy QR Data**: From booking success page
3. **Validate**: Paste in admin dashboard QR scanner
4. **Result**: Should show passenger details

### **Sample QR Data Structure:**
```json
{
  "bookingId": "bk_1730896420847_kampala_jinja",
  "passengerName": "John Doe", 
  "route": "Kampala → Jinja",
  "seatNumber": "A12",
  "travelDate": "2025-11-07T08:00:00.000Z",
  "busPlate": "UAH-001A",
  "operator": "Swift Safaris",
  "timestamp": "2025-11-06T12:30:00.000Z",
  "signature": "security_signature_here"
}
```

## ⚡ **Immediate Testing Option**

**To test right now:**
1. Open web portal: https://transconnect-web.vercel.app
2. Register as passenger
3. Book any available route
4. Complete demo payment
5. Copy QR data from success page
6. Switch to admin dashboard
7. Paste QR data in scanner
8. See validation result!

## 🔄 **Current QR Scanner Capabilities**

**✅ Working:**
- QR data validation
- Passenger detail display
- Duplicate scan detection
- Security verification

**🔧 In Progress:**
- Camera QR image scanning (needs QR decode library)
- Image upload processing
- Real-time camera detection

**📱 Coming Soon:**
- Mobile app QR display
- Push notification tickets
- Offline QR storage

---

**The QR system is fully functional - the main missing piece is the QR image processing library for camera scanning. For now, operators can copy QR data from passenger screens and paste in the manual input field.**