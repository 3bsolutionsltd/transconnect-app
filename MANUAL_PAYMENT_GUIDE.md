# 💰 Manual Payment System Guide

## 🎯 **Overview**
TransConnect's manual payment system allows operators to process cash payments offline and confirm them manually through the system. This is perfect for customers who prefer to pay cash at the bus station or through agent locations.

## 🔄 **How Manual Payments Work**

### **Step 1: Customer Initiates Cash Payment**
When customers book a ticket, they can select **"Cash Payment"** as their payment method:

```typescript
// Available payment methods
const paymentMethods = [
  { id: 'MTN_MOBILE_MONEY', name: 'MTN Mobile Money' },
  { id: 'AIRTEL_MONEY', name: 'Airtel Money' },
  { id: 'FLUTTERWAVE', name: 'Card Payment' },
  { id: 'CASH', name: 'Cash Payment' }  // 👈 Manual payment option
];
```

**What happens:**
- ✅ Payment record created with status `PENDING`
- ✅ Booking created with status `PENDING`
- ✅ Customer gets booking reference number
- ✅ No actual money processing (offline payment)

### **Step 2: Customer Pays Cash**
Customer visits:
- **Bus station** counter
- **Agent location** 
- **Operator office**
- **Bus conductor** (on boarding)

**Customer provides:**
- Booking reference number
- Payment amount
- Personal identification

### **Step 3: Operator Processes Payment**
Operators can access pending cash payments through these API endpoints:

#### **🔍 View Pending Cash Payments**
```
GET /api/operator-payments/pending-cash
Authorization: Bearer <operator-token>
```

**Response includes:**
```json
{
  "pendingPayments": [
    {
      "id": "payment-123",
      "reference": "PAY1729123456ABCD",
      "amount": 25000,
      "createdAt": "2024-11-13T10:30:00Z",
      "passenger": {
        "name": "John Doe",
        "phone": "+256701234567",
        "email": "john@example.com"
      },
      "booking": {
        "id": "booking-456",
        "seatNumber": "A12",
        "travelDate": "2024-11-15"
      },
      "route": {
        "origin": "Kampala",
        "destination": "Gulu",
        "departureTime": "08:00"
      },
      "bus": {
        "plateNumber": "UAH 123X",
        "model": "Toyota Coaster"
      }
    }
  ]
}
```

#### **✅ Confirm or ❌ Reject Payment**
```
POST /api/operator-payments/{paymentId}/process
Authorization: Bearer <operator-token>

{
  "action": "confirm",        // or "reject"
  "notes": "Cash received at station counter"
}
```

## 🎯 **Operator Actions**

### **Confirm Payment** ✅
When operator confirms payment:
1. **Payment status** → `COMPLETED`
2. **Booking status** → `CONFIRMED`
3. **QR code generated** automatically
4. **Customer notification** sent via email/SMS
5. **Ticket becomes valid** for travel

### **Reject Payment** ❌
When operator rejects payment:
1. **Payment status** → `FAILED`
2. **Booking status** → `CANCELLED`
3. **Customer notification** sent with reason
4. **Seat becomes available** again

## 📊 **Operator Dashboard Features**

### **Pending Payments View**
```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Pending Cash Payments (3 payments)                      │
├─────────────────────────────────────────────────────────────┤
│ REF: PAY1729123456ABCD  │  UGX 25,000  │  John Doe         │
│ Kampala → Gulu         │  Seat A12    │  [Confirm][Reject] │
├─────────────────────────────────────────────────────────────┤
│ REF: PAY1729123457EFGH  │  UGX 30,000  │  Jane Smith       │
│ Kampala → Mbarara      │  Seat B05    │  [Confirm][Reject] │
└─────────────────────────────────────────────────────────────┘
```

### **Payment History & Analytics**
```
GET /api/operator-payments/history?page=1&limit=10&status=COMPLETED
GET /api/operator-payments/analytics?period=30
```

**Analytics include:**
- 📈 Total revenue from cash payments
- 📊 Payment method breakdown
- 📅 Daily revenue trends
- ✅ Success rate statistics
- 📱 Payment channel performance

## 🔧 **Technical Implementation**

### **Database Schema**
```sql
-- Payment record
{
  id: "payment-123",
  bookingId: "booking-456",
  userId: "user-789",
  amount: 25000,
  method: "CASH",
  status: "PENDING", -- PENDING → COMPLETED/FAILED
  reference: "PAY1729123456ABCD",
  metadata: {
    processedManually: true,
    processedBy: "Swift Transport Ltd",
    processedAt: "2024-11-13T12:00:00Z",
    operatorNotes: "Cash received at station",
    operatorAction: "confirm"
  }
}
```

### **QR Code Generation**
When payment is confirmed, system automatically generates QR code with:
```json
{
  "bookingId": "booking-456",
  "passengerName": "John Doe",
  "route": "Kampala → Gulu",
  "seatNumber": "A12",
  "travelDate": "2024-11-15",
  "busPlate": "UAH 123X",
  "operator": "Swift Transport",
  "amount": 25000,
  "signature": "abc123def456" // Security signature
}
```

## 🚀 **Implementation Benefits**

### **For Operators:**
- 💰 **Cash flow management** - Track all cash payments
- 📱 **Mobile processing** - Confirm payments from anywhere
- 📊 **Real-time analytics** - Monitor payment performance
- 🔍 **Fraud prevention** - Verify payments before confirmation
- 📋 **Audit trail** - Complete payment history with notes

### **For Customers:**
- 💵 **Cash option available** - No need for mobile money
- 📧 **Instant confirmation** - Email/SMS when payment confirmed
- 📱 **QR ticket generation** - Digital ticket after payment
- 🔄 **Flexible payment** - Pay at station, agent, or on bus
- ⏰ **Hold reservation** - Seat held until payment deadline

### **For Business:**
- 📈 **Increased bookings** - Cater to cash-preferring customers
- 🏪 **Agent network** - Enable third-party payment processing
- 💼 **Reduced fraud** - Manual verification step
- 📊 **Better analytics** - Track all payment channels
- 🔄 **Operational flexibility** - Handle various payment scenarios

## 🎛️ **Admin Configuration**

### **Payment Methods Setup**
```typescript
// Available payment methods returned by API
{
  "supportedMethods": [
    {
      "value": "CASH",
      "label": "Cash Payment",
      "isOnline": false  // 👈 Indicates manual processing
    },
    {
      "value": "MTN_MOBILE_MONEY",
      "label": "MTN Mobile Money", 
      "isOnline": true   // 👈 Automatic processing
    }
  ]
}
```

### **Business Rules**
- **Payment timeout**: Cash payments expire after 24 hours if not confirmed
- **Seat holding**: Seats held during pending payment period
- **Notification timing**: Immediate alerts when payment status changes
- **Operator permissions**: Only verified operators can process payments

## 🔐 **Security Features**

### **Payment Verification**
- ✅ **Operator authentication** required
- ✅ **Route ownership** verified (operators can only process their routes)
- ✅ **Payment signature** generated for QR codes
- ✅ **Audit logging** for all manual actions
- ✅ **Status validation** (prevent double-processing)

### **Fraud Prevention**
- 🔒 **Reference number** validation
- 🔒 **Amount verification** against booking
- 🔒 **Time-based expiry** for pending payments
- 🔒 **Operator notes** required for rejections
- 🔒 **Customer notification** for all status changes

---

## 🎯 **Quick Start for Operators**

1. **Login** to operator dashboard
2. **Navigate** to "Pending Payments" section  
3. **Review** customer payment details
4. **Verify** customer paid correct amount
5. **Click "Confirm"** to approve payment
6. **Add notes** about payment method/location
7. **Customer automatically notified** and gets QR ticket

**🚀 Your manual payment system is now live and ready to handle cash payments efficiently!**