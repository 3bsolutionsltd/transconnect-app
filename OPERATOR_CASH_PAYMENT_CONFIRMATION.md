# Operator Cash Payment Confirmation Feature

## Overview
Feature to allow bus operators to confirm cash/over-the-counter payments made by customers at their offices or agent locations.

## Current State
- Mobile app allows users to select "Cash / Over the Counter" payment option
- Bookings are created with `status: 'PENDING'`
- Payment records have `method: 'CASH'` and `status: 'PENDING'`
- QR codes are generated during booking creation

## Required Implementation (Operator Dashboard)

### 1. Pending Payments View
**Location**: Operator Dashboard → Bookings/Payments section

**Features**:
- Table showing all bookings with CASH payment method and PENDING status
- Display columns:
  - Booking ID
  - Customer name
  - Route (origin → destination)
  - Travel date
  - Seat numbers
  - Amount to collect
  - Booking created date/time
  - Time elapsed since booking
- Filter options:
  - By route
  - By date range
  - By amount
- Search by customer name or booking ID

### 2. Payment Confirmation Action
**Functionality**:
- "Confirm Payment" button for each pending booking
- Modal/dialog to confirm:
  - Amount received
  - Payment date/time
  - Optional: Receipt number
  - Optional: Notes
- Update booking `status` from 'PENDING' to 'CONFIRMED'
- Update payment `status` to 'COMPLETED'
- Record payment confirmation timestamp
- Record which operator staff member confirmed

### 3. Notifications After Confirmation
- Send SMS/push notification to customer confirming payment received
- Include QR code access link
- Send confirmation email with ticket details

### 4. Cancel Unpaid Bookings
**Features**:
- "Cancel Booking" button for no-shows
- Confirmation dialog with reason selection:
  - Customer didn't show up
  - Customer cancelled
  - Payment deadline passed
  - Other (with text field)
- Update booking `status` to 'CANCELLED'
- Release seat for other customers
- Send cancellation notification to customer

### 5. Dashboard Widget
- Count of pending cash payments
- Total amount pending collection
- Oldest pending payment (time since booking)
- Quick action button to view all pending payments

## Backend API Endpoints (Already Available)

```
GET /api/bookings?paymentMethod=CASH&status=PENDING
POST /api/bookings/:id/confirm-payment
POST /api/bookings/:id/cancel
```

## Database Changes (Already Implemented)
- `bookings.status`: PENDING, CONFIRMED, CANCELLED
- `payments.method`: CASH
- `payments.status`: PENDING, COMPLETED

## Priority
**Medium** - Nice to have for better cash flow tracking and customer experience

## Estimated Effort
- Frontend UI: 4-6 hours
- Backend integration: 2-3 hours
- Testing: 2 hours
- Total: ~8-11 hours

## Related Files
- Mobile: `transconnect-mobile/src/screens/booking/PaymentScreen.tsx`
- Backend: `transconnect-backend/src/routes/bookings.ts`
- Backend: `transconnect-backend/src/routes/payments.ts`

## Notes
- Consider adding auto-cancellation for bookings not paid within X hours (e.g., 2 hours before departure)
- May need operator role/permission checks to prevent unauthorized confirmations
- Consider adding daily report of pending cash payments for operators
