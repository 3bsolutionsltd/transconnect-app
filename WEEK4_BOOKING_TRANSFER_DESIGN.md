# Phase 1 Week 4: Booking Transfer System - Design Document

## Overview
Enable customers to request booking transfers (change travel date/time) with manager/admin approval workflow.

---

## Database Schema Additions

### 1. New Enums

```prisma
enum TransferStatus {
  PENDING       // Transfer requested, awaiting approval
  APPROVED      // Approved by manager/admin
  REJECTED      // Rejected by manager/admin
  COMPLETED     // Transfer executed, seat reassigned
  CANCELLED     // Customer cancelled the transfer request
}

enum TransferReason {
  SCHEDULE_CONFLICT
  EMERGENCY
  MISSED_BUS
  PERSONAL_REASONS
  OTHER
}
```

### 2. Update UserRole Enum

```prisma
enum UserRole {
  PASSENGER
  OPERATOR
  MANAGER      // NEW: Can manage bookings across operators
  ADMIN
}
```

### 3. BookingTransfer Table

Tracks all transfer requests from customers.

```prisma
model BookingTransfer {
  id                String         @id @default(cuid())
  bookingId         String         // Original booking being transferred
  userId            String         // Customer requesting transfer
  
  // Transfer details
  fromRouteId       String         // Original route
  toRouteId         String         // Target route (can be same route, different date)
  fromTravelDate    DateTime       // Original travel date
  toTravelDate      DateTime       // Requested travel date
  fromSeatNumber    String         // Original seat
  toSeatNumber      String?        // Requested/assigned seat (null until approved)
  
  // Pricing adjustments
  originalAmount    Float          // Original booking amount
  newAmount         Float          // New booking amount (if route/date changes)
  priceDifference   Float          // Difference (positive = customer pays more, negative = refund)
  
  // Request details
  reason            TransferReason @default(OTHER)
  reasonText        String?        // Additional explanation
  status            TransferStatus @default(PENDING)
  
  // Approval workflow
  requestedAt       DateTime       @default(now())
  reviewedAt        DateTime?      // When manager/admin reviewed
  reviewedBy        String?        // User ID of manager/admin
  reviewerNotes     String?        // Internal notes from reviewer
  
  // Transfer execution
  completedAt       DateTime?      // When transfer was executed
  metadata          Json?          // Additional data (payment refs, etc.)
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  // Relations
  booking           Booking        @relation("OriginalBooking", fields: [bookingId], references: [id], onDelete: Cascade)
  customer          User           @relation("TransferRequests", fields: [userId], references: [id])
  fromRoute         Route          @relation("TransferFromRoute", fields: [fromRouteId], references: [id])
  toRoute           Route          @relation("TransferToRoute", fields: [toRouteId], references: [id])
  reviewer          User?          @relation("TransferReviews", fields: [reviewedBy], references: [id])
  seatHistory       BookingSeatHistory[]

  @@index([bookingId])
  @@index([userId])
  @@index([status])
  @@index([toTravelDate])
  @@map("booking_transfers")
}
```

### 4. BookingSeatHistory Table

Tracks all seat changes for audit trail.

```prisma
model BookingSeatHistory {
  id              String    @id @default(cuid())
  bookingId       String    // Booking that changed
  transferId      String?   // Related transfer request (if applicable)
  
  // Seat change details
  oldSeatNumber   String    // Previous seat
  newSeatNumber   String    // New seat assigned
  oldRouteId      String    // Previous route
  newRouteId      String    // New route
  oldTravelDate   DateTime  // Previous travel date
  newTravelDate   DateTime  // New travel date
  
  // Change metadata
  changeReason    String    // 'TRANSFER', 'ADMIN_OVERRIDE', 'SYSTEM_ADJUSTMENT'
  changedBy       String    // User ID who made the change
  notes           String?   // Optional notes
  
  createdAt       DateTime  @default(now())

  // Relations
  booking         Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  transfer        BookingTransfer?  @relation(fields: [transferId], references: [id])
  changedByUser   User              @relation("SeatChanges", fields: [changedBy], references: [id])
  oldRoute        Route             @relation("HistoryOldRoute", fields: [oldRouteId], references: [id])
  newRoute        Route             @relation("HistoryNewRoute", fields: [newRouteId], references: [id])

  @@index([bookingId])
  @@index([transferId])
  @@map("booking_seat_history")
}
```

### 5. Update Existing Models

**Booking Model** - Add relations:
```prisma
model Booking {
  // ... existing fields ...
  
  // NEW Relations
  transfers       BookingTransfer[] @relation("OriginalBooking")
  seatHistory     BookingSeatHistory[]
}
```

**User Model** - Add relations:
```prisma
model User {
  // ... existing fields ...
  
  // NEW Relations
  transferRequests    BookingTransfer[] @relation("TransferRequests")
  transferReviews     BookingTransfer[] @relation("TransferReviews")
  seatChanges         BookingSeatHistory[] @relation("SeatChanges")
}
```

**Route Model** - Add relations:
```prisma
model Route {
  // ... existing fields ...
  
  // NEW Relations
  transfersFrom       BookingTransfer[] @relation("TransferFromRoute")
  transfersTo         BookingTransfer[] @relation("TransferToRoute")
  seatHistoryOld      BookingSeatHistory[] @relation("HistoryOldRoute")
  seatHistoryNew      BookingSeatHistory[] @relation("HistoryNewRoute")
}
```

---

## API Endpoints

### Customer APIs

#### 1. Request Booking Transfer
```
POST /api/bookings/:bookingId/transfers
Auth: Required (Customer)

Request Body:
{
  "toRouteId": "clx123...",           // Target route ID
  "toTravelDate": "2026-03-15",       // New travel date
  "toSeatNumber": "A12",              // Preferred seat (optional)
  "reason": "SCHEDULE_CONFLICT",      // TransferReason enum
  "reasonText": "Work meeting rescheduled"
}

Response:
{
  "success": true,
  "message": "Transfer request submitted successfully",
  "data": {
    "transferId": "clx456...",
    "status": "PENDING",
    "priceDifference": 5000,          // UGX (+ means pay more)
    "newAmount": 35000,
    "requiredPayment": true           // If price increased
  }
}
```

#### 2. Get My Transfer Requests
```
GET /api/bookings/transfers/my-requests
Auth: Required (Customer)

Query Params:
- status: PENDING | APPROVED | REJECTED | COMPLETED
- page: 1
- limit: 10

Response:
{
  "success": true,
  "data": {
    "transfers": [...],
    "pagination": { ... }
  }
}
```

#### 3. Cancel Transfer Request
```
DELETE /api/bookings/transfers/:transferId
Auth: Required (Customer - must own the transfer)

Response:
{
  "success": true,
  "message": "Transfer request cancelled"
}
```

### Manager/Admin APIs

#### 4. Get Pending Transfers
```
GET /api/manager/transfers/pending
Auth: Required (MANAGER or ADMIN)

Query Params:
- operatorId: "clx123..." (optional, filter by operator)
- fromDate: "2026-03-01"
- toDate: "2026-03-31"
- page: 1
- limit: 20

Response:
{
  "success": true,
  "data": {
    "transfers": [
      {
        "id": "clx456...",
        "customer": { "name": "John Doe", "phone": "+256..." },
        "originalBooking": { ... },
        "requestedChange": { ... },
        "priceDifference": 5000,
        "requestedAt": "2026-03-10T10:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 5. Approve/Reject Transfer
```
POST /api/manager/transfers/:transferId/review
Auth: Required (MANAGER or ADMIN)

Request Body:
{
  "action": "APPROVE",                 // APPROVE or REJECT
  "toSeatNumber": "B15",               // Assign seat if approved
  "reviewerNotes": "Approved due to emergency",
  "refundAmount": 0                    // If price decreased
}

Response:
{
  "success": true,
  "message": "Transfer approved successfully",
  "data": {
    "transferId": "clx456...",
    "status": "APPROVED",
    "completedAt": "2026-03-10T14:45:00Z",
    "newBookingDetails": { ... }
  }
}
```

#### 6. Get Transfer History
```
GET /api/manager/transfers/history
Auth: Required (MANAGER or ADMIN)

Response:
{
  "success": true,
  "data": {
    "transfers": [...],
    "stats": {
      "totalRequests": 45,
      "approved": 38,
      "rejected": 7,
      "averageProcessingTime": "4.2 hours"
    }
  }
}
```

---

## Business Logic

### Transfer Request Validation

When customer requests transfer:
1. ✅ Verify booking exists and belongs to user
2. ✅ Check booking status is CONFIRMED (not CANCELLED/COMPLETED)
3. ✅ Ensure travel date hasn't passed
4. ✅ Verify target route exists and is active
5. ✅ Check if target date/seat is available
6. ✅ Calculate price difference (if routes/dates differ)
7. ✅ Check if customer has pending transfers for same booking
8. ✅ Create transfer request with PENDING status

### Transfer Approval Logic

When manager/admin approves:
1. ✅ Verify transfer still PENDING
2. ✅ Confirm target seat still available
3. ✅ If price increased:
   - Create new payment record (PENDING)
   - Notify customer to pay difference
   - Don't complete transfer until paid
4. ✅ If price decreased:
   - Process refund (mark for refund)
   - Notify customer of refund
5. ✅ Update original booking:
   - Change route, travel date, seat
   - Update totalAmount/actualPrice
6. ✅ Create seat history record
7. ✅ Update transfer status to COMPLETED
8. ✅ Send customer notification

### Transfer Rejection Logic

When manager/admin rejects:
1. ✅ Update transfer status to REJECTED
2. ✅ Record reviewer notes
3. ✅ Send customer notification with reason
4. ✅ Original booking remains unchanged

---

## Price Adjustment Rules

### Scenarios:

1. **Same route, same date, different seat**
   - Price difference: 0
   - Only seat changes (e.g., A12 → B15)

2. **Same route, different date**
   - Check segment price variations
   - Weekend/holiday may have different pricing
   - Calculate difference based on date

3. **Different route, same date**
   - Calculate based on route base prices
   - Consider stopover segments if applicable

4. **Different route, different date**
   - Full recalculation needed
   - Consider both route and date pricing

### Payment Handling:

- **Price increase**: Customer must pay difference before transfer completes
- **Price decrease**: System marks for refund (processed manually or via original payment method)
- **No change**: Transfer completes immediately upon approval

---

## Notification Messages

### 1. Transfer Request Submitted (to Customer)
```
Title: "Transfer Request Submitted"
Message: "Your transfer request for booking #{bookingId} has been submitted. 
We'll review it within 24 hours."
Type: INFO
```

### 2. Transfer Approved (to Customer)
```
Title: "Transfer Request Approved ✅"
Message: "Your transfer has been approved! 
New seat: {newSeat}
New date: {newDate}
{price difference message if applicable}"
Type: SUCCESS
Action: "View Updated Ticket"
```

### 3. Transfer Rejected (to Customer)
```
Title: "Transfer Request Declined"
Message: "Your transfer request was declined. 
Reason: {reviewerNotes}
Your original booking remains valid."
Type: WARNING
```

### 4. Additional Payment Required (to Customer)
```
Title: "Payment Required for Transfer"
Message: "Your transfer was approved! Pay UGX {amount} to complete the transfer."
Type: INFO
Action: "Pay Now"
```

### 5. New Transfer Request (to Manager/Admin)
```
Title: "New Transfer Request"
Message: "{customerName} requested to transfer booking #{bookingId}. Review now."
Type: INFO
Action: "Review Transfer"
```

---

## Manager Role Permissions

### Manager vs Operator vs Admin

| Action | Passenger | Operator | Manager | Admin |
|--------|-----------|----------|---------|-------|
| Request transfer | ✅ Own bookings | ❌ | ❌ | ❌ |
| View own transfers | ✅ | ❌ | ❌ | ❌ |
| View all transfers | ❌ | ✅ Their routes | ✅ All routes | ✅ All routes |
| Approve/Reject | ❌ | ✅ Their routes | ✅ All routes | ✅ All routes |
| View analytics | ❌ | ✅ Their data | ✅ All data | ✅ All data |
| Override prices | ❌ | ❌ | ✅ | ✅ |
| Manage managers | ❌ | ❌ | ❌ | ✅ |

### Manager Use Cases:
- Handle transfer requests when multiple operators involved
- Override transfer decisions for customer service
- View cross-operator analytics (when customer books different operators)
- Manage complex multi-leg transfers

---

## Implementation Checklist

### Phase 1: Database & Schema
- [ ] Add MANAGER to UserRole enum
- [ ] Create TransferStatus enum
- [ ] Create TransferReason enum
- [ ] Create BookingTransfer model
- [ ] Create BookingSeatHistory model
- [ ] Update Booking, User, Route relations
- [ ] Generate Prisma migration
- [ ] Apply migration to staging DB

### Phase 2: Backend APIs
- [ ] Create `/api/bookings/:id/transfers` endpoint (customer request)
- [ ] Create `/api/bookings/transfers/my-requests` endpoint
- [ ] Create `/api/manager/transfers/pending` endpoint
- [ ] Create `/api/manager/transfers/:id/review` endpoint
- [ ] Add middleware for MANAGER role authorization
- [ ] Implement seat availability check logic
- [ ] Implement price difference calculation
- [ ] Create seat history tracking

### Phase 3: Business Logic
- [ ] Transfer validation service
- [ ] Price adjustment calculator
- [ ] Seat reassignment logic
- [ ] Payment integration (for price differences)
- [ ] Refund handling logic

### Phase 4: Notifications
- [ ] Transfer requested notification
- [ ] Transfer approved notification
- [ ] Transfer rejected notification
- [ ] Additional payment required notification
- [ ] Manager new request notification

### Phase 5: Testing
- [ ] Unit tests for transfer validation
- [ ] Integration tests for transfer workflow
- [ ] Test price calculations
- [ ] Test seat reassignment
- [ ] End-to-end transfer approval flow

---

## Testing Scenarios

### Scenario 1: Simple Date Change
1. Customer books Kampala → Mbarara for March 15
2. Customer requests transfer to March 18 (same route)
3. Manager approves
4. System updates booking date
5. Customer receives new QR code

### Scenario 2: Route + Date Change (Price Increase)
1. Customer books Kampala → Masaka (50,000 UGX) for March 15
2. Customer requests transfer to Kampala → Mbarara (80,000 UGX) for March 18
3. System calculates difference: +30,000 UGX
4. Manager approves
5. Customer notified to pay 30,000 UGX
6. Customer pays
7. Booking updated to new route

### Scenario 3: Transfer Rejection
1. Customer requests transfer to fully booked date
2. Manager reviews, sees no available seats
3. Manager rejects with note: "No seats available"
4. Customer notified of rejection
5. Original booking remains unchanged

---

## Migration Timeline

**Day 1-2**: Schema design, migration creation, database updates  
**Day 3-4**: Backend APIs implementation  
**Day 5**: Business logic, validations, calculations  
**Day 6**: Notification integration  
**Day 7**: Testing and deployment

---

## Success Metrics

- Transfer request processing time < 24 hours
- Transfer approval rate > 80%
- Customer satisfaction with transfer process > 4/5
- Zero data loss during transfers (audit trail complete)
- Price calculation accuracy: 100%

---

**Status**: Design Complete ✅  
**Next**: Implement schema changes and migrations  
**Estimated Time**: 1 week
