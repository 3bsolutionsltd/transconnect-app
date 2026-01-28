# TransConnect Field Team Enhancements - Implementation Plan

**Date**: January 28, 2026  
**Status**: Pending Review  
**Priority**: High (Production Issues)

---

## ⚠️ CRITICAL PRODUCTION ISSUE (Discovered Jan 28, 2026)

### Mobile App Route Details Validation Error

**Severity**: CRITICAL - Blocking all bookings  
**Impact**: 100% of users unable to complete bookings  
**Status**: Fix in progress

#### Issue Description
After deploying JWT token refresh fix (v1.0.8), overly strict validation logic is blocking all route detail views:
- Users see "Invalid route data: please try again" when clicking any route
- Some routes show "Something went wrong" error
- Validation failing because it checks for `routeData.operatorName` but API returns `routeData.operator.companyName`

#### Root Cause
```typescript
// BROKEN CODE (lines 47-54)
if (!routeData.departureTime || !routeData.operatorName) {
  // Rejects routes with operator.companyName instead of operatorName
}
```

#### Production Logs Evidence
```
Routes API called with params: { origin: 'Kampala', destination: 'Fort Portal' }
Status: 200 OK (122 bytes) - API working fine
Mobile App: "Invalid route data" - Validation rejecting valid data
```

#### Fix Applied
```typescript
// FIXED CODE
const hasOperatorInfo = routeData.operatorName || routeData.operator?.companyName;
if (!routeData.departureTime || !hasOperatorInfo) {
  // Now accepts both formats
}
```

#### Immediate Actions Required
1. ✅ Fix validation logic to accept both operator name formats
2. ⏳ Commit and push fix (commit in progress)
3. ⏳ Rebuild mobile app v1.0.9
4. ⏳ Emergency deployment to Play Store
5. ⏳ Notify users of critical update

#### Lessons Learned
- Add validation checks must account for API response variations
- Need comprehensive integration testing before production deployment
- Require staging environment with production-like data
- Implement feature flags for gradual rollout

---

## Executive Summary

This document outlines solutions for critical operational issues identified by the field team during production deployment. The enhancements focus on:
1. Enhanced user role management
2. Intelligent route and pricing management
3. Dynamic booking and transfer system
4. Robust seat inventory management

---

## 1. USER MANAGEMENT ENHANCEMENT

### Problem
Admin role is being used for both system administrators and TransConnect operational managers, creating security and permission concerns.

### Proposed Solution
Create a new **TransConnect Manager** role with specific operational permissions.

#### Role Hierarchy
```
System Admin (Full Control)
  ├── TransConnect Manager (Operational Management)
  │   ├── Manage Operators
  │   ├── Manage Routes & Pricing
  │   ├── View All Bookings
  │   ├── Handle Transfers
  │   ├── Manage Bus Assignments
  │   └── View Reports & Analytics
  └── Operator (Company Specific)
      ├── Manage Own Buses
      ├── Manage Own Routes
      └── View Own Bookings
```

#### Database Changes
```sql
-- Add new role type
ALTER TYPE user_role ADD VALUE 'transconnect_manager';

-- Add permissions table
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role user_role NOT NULL,
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Predefined permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('transconnect_manager', 'manage_operators'),
  ('transconnect_manager', 'manage_routes'),
  ('transconnect_manager', 'manage_transfers'),
  ('transconnect_manager', 'view_all_bookings'),
  ('transconnect_manager', 'manage_dynamic_buses'),
  ('transconnect_manager', 'view_analytics');
```

#### Implementation Tasks
- [ ] Update user schema with new role type
- [ ] Create permissions middleware
- [ ] Update admin dashboard with role-based UI
- [ ] Add user management interface for System Admin

**Priority**: Medium  
**Complexity**: Low  
**Estimated Time**: 2-3 days

---

## 2. AUTOMATED ROUTE DISTANCE & DURATION CALCULATION

### Problem
Manually entering distance and duration for routes with multiple stopovers is tedious and error-prone.

### Proposed Solution
Integrate Google Maps Distance Matrix API to automatically calculate:
- Total route distance
- Estimated travel duration
- Distance between each stopover
- Duration for each leg of the journey

#### Database Changes
```sql
-- Add calculated fields to routes table
ALTER TABLE routes ADD COLUMN auto_calculated BOOLEAN DEFAULT true;
ALTER TABLE routes ADD COLUMN calculation_data JSONB;

-- Store detailed leg information
-- calculation_data structure:
{
  "total_distance_km": 450,
  "total_duration_minutes": 360,
  "legs": [
    {
      "from": "Kampala",
      "to": "Masaka",
      "distance_km": 125,
      "duration_minutes": 90
    },
    {
      "from": "Masaka",
      "to": "Mbarara",
      "distance_km": 325,
      "duration_minutes": 270
    }
  ],
  "calculated_at": "2026-01-28T10:00:00Z",
  "via_points": ["Masaka", "Lyantonde"]
}
```

#### API Integration
```typescript
// New service: src/services/routeCalculation.ts
interface RouteCalculationRequest {
  origin: string;
  destination: string;
  viaPoints: string[]; // Stopovers
}

interface RouteCalculationResult {
  totalDistanceKm: number;
  totalDurationMinutes: number;
  legs: RouteLeg[];
}

async function calculateRouteMetrics(request: RouteCalculationRequest): Promise<RouteCalculationResult> {
  // Call Google Maps Distance Matrix API
  // Calculate each leg between origin -> via1 -> via2 -> destination
  // Sum up totals
  // Return structured data
}
```

#### Admin UI Changes
- Add "Calculate Automatically" button when creating/editing routes
- Show breakdown of each leg with distances
- Allow manual override if needed
- Display last calculation timestamp
- Show warning if route data is outdated (>30 days)

#### Cost Consideration
- Google Maps Distance Matrix API: ~$5 per 1000 requests
- Cache calculations for frequently used routes
- Recalculate only when route/stopovers change

**Priority**: High  
**Complexity**: Medium  
**Estimated Time**: 4-5 days  
**Dependencies**: Google Maps API key with Distance Matrix enabled

---

## 3. STOPOVER AS SEARCHABLE DESTINATIONS

### Problem
Passengers searching for stopover towns as destinations get "No routes found" because the system only searches origin and destination fields.

### Current Schema Issue
```sql
-- Current: vias stored as TEXT array
routes {
  origin TEXT,
  destination TEXT,
  vias TEXT[] -- ["Masaka", "Lyantonde"]
}
```

### Proposed Solution: Route Segments Model

Create a **route segments** approach where every stopover becomes a valid search endpoint.

#### New Database Schema
```sql
-- Enhanced routes table
ALTER TABLE routes ADD COLUMN segment_enabled BOOLEAN DEFAULT true;

-- New route_segments table
CREATE TABLE route_segments (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  segment_order INTEGER NOT NULL,
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  distance_km DECIMAL(10,2),
  duration_minutes INTEGER,
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(route_id, segment_order)
);

-- Index for fast searching
CREATE INDEX idx_route_segments_locations ON route_segments(from_location, to_location);
CREATE INDEX idx_route_segments_from ON route_segments(from_location);
CREATE INDEX idx_route_segments_to ON route_segments(to_location);

-- Example data for route: Kampala -> Masaka -> Lyantonde -> Mbarara
INSERT INTO route_segments (route_id, segment_order, from_location, to_location, distance_km, duration_minutes, base_price) VALUES
  (1, 1, 'Kampala', 'Masaka', 125, 90, 15000),
  (1, 2, 'Masaka', 'Lyantonde', 80, 60, 10000),
  (1, 3, 'Lyantonde', 'Mbarara', 145, 120, 12000);
```

#### Search Algorithm Enhancement
```typescript
// New search logic in src/services/routeSearch.ts
interface SearchRequest {
  origin: string;
  destination: string;
  date: Date;
}

async function searchRoutes(req: SearchRequest) {
  // Find all possible routes from origin to destination
  // including those where they are stopovers
  
  const query = `
    WITH route_connections AS (
      -- Direct routes
      SELECT DISTINCT r.*, 
        rs1.from_location as pickup,
        rs2.to_location as dropoff,
        SUM(rs.base_price) as calculated_price
      FROM routes r
      JOIN route_segments rs1 ON rs1.route_id = r.id
      JOIN route_segments rs2 ON rs2.route_id = r.id
      JOIN route_segments rs ON rs.route_id = r.id 
        AND rs.segment_order BETWEEN rs1.segment_order AND rs2.segment_order
      WHERE rs1.from_location ILIKE $1
        AND rs2.to_location ILIKE $2
        AND rs1.segment_order <= rs2.segment_order
      GROUP BY r.id, rs1.from_location, rs2.to_location
    )
    SELECT * FROM route_connections
    WHERE date = $3
    ORDER BY calculated_price, departure_time;
  `;
  
  return await db.query(query, [origin, destination, date]);
}
```

#### Pricing Logic
```typescript
// Calculate price based on segments traveled
function calculateSegmentPrice(routeId: number, from: string, to: string): number {
  // Get all segments between from and to
  // Sum their base prices
  // Apply any operator-specific pricing rules
}
```

#### Migration Plan
1. Create route_segments table
2. Migrate existing routes data:
   - Create segments from origin -> each via -> destination
   - Split current price proportionally by distance
3. Update search API to use new logic
4. Backwards compatibility: Keep vias field for display purposes
5. Update admin UI to manage segments instead of simple vias

**Priority**: High (Critical for production)  
**Complexity**: High  
**Estimated Time**: 6-8 days  
**Testing Required**: Extensive search scenarios

---

## 4. STOPOVER PRICING MANAGEMENT

### Problem
Operators charge different rates for different stopovers, but current system only has one price per route.

### Solution
Already addressed in Section 3 with route_segments approach. Each segment has its own base_price.

#### Admin UI for Pricing
```
Route: Kampala to Mbarara

┌─────────────────────────────────────────────────────┐
│ Segment 1: Kampala → Masaka                        │
│ Distance: 125 km | Duration: 1h 30m                │
│ Price: UGX 15,000                            [Edit] │
├─────────────────────────────────────────────────────┤
│ Segment 2: Masaka → Lyantonde                      │
│ Distance: 80 km | Duration: 1h                     │
│ Price: UGX 10,000                            [Edit] │
├─────────────────────────────────────────────────────┤
│ Segment 3: Lyantonde → Mbarara                     │
│ Distance: 145 km | Duration: 2h                    │
│ Price: UGX 12,000                            [Edit] │
└─────────────────────────────────────────────────────┘

Total Route Price: UGX 37,000
```

#### Bulk Pricing Tools
```typescript
// Admin helper functions
interface PricingRule {
  pricePerKm?: number;  // e.g., 120 UGX/km
  basePrice?: number;    // e.g., 5000 UGX minimum
  roundTo?: number;      // Round to nearest 1000
}

function applyPricingRule(segments: RouteSegment[], rule: PricingRule) {
  // Auto-calculate prices based on distance
  // Operator can then adjust individual segments
}
```

**Priority**: High  
**Complexity**: Medium (covered by Section 3)  
**Estimated Time**: Included in Section 3

---

## 5. BOOKING TRANSFER MANAGEMENT

### Problem
Need to transfer passengers between buses when:
- Customer booked wrong bus
- Original bus has mechanical issues
- Bus schedule changes
- Capacity reallocation needed

### Proposed Solution: Booking Transfer System

#### Database Schema
```sql
-- New booking_transfers table
CREATE TABLE booking_transfers (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE RESTRICT,
  original_schedule_id INTEGER REFERENCES bus_schedules(id),
  new_schedule_id INTEGER REFERENCES bus_schedules(id),
  reason TEXT NOT NULL,
  initiated_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Track seat changes
CREATE TABLE booking_seat_history (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  schedule_id INTEGER REFERENCES bus_schedules(id),
  seat_number VARCHAR(10),
  action VARCHAR(50), -- allocated, released, transferred
  action_date TIMESTAMP DEFAULT NOW(),
  action_by INTEGER REFERENCES users(id)
);

-- Add transfer flag to bookings
ALTER TABLE bookings ADD COLUMN is_transferred BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN transfer_id INTEGER REFERENCES booking_transfers(id);
```

#### Transfer Workflow
```typescript
interface TransferRequest {
  bookingId: number;
  newScheduleId: number;
  reason: string;
  initiatedBy: number;
  notifyCustomer: boolean;
}

async function initiateBookingTransfer(req: TransferRequest) {
  const booking = await getBooking(req.bookingId);
  const newSchedule = await getSchedule(req.newScheduleId);
  
  // 1. Validate new bus has available seats
  const availableSeats = await getAvailableSeats(req.newScheduleId);
  if (availableSeats.length < booking.passengers.length) {
    throw new Error('Insufficient seats on new bus');
  }
  
  // 2. Create transfer record
  const transfer = await db.bookingTransfers.create({
    bookingId: req.bookingId,
    originalScheduleId: booking.scheduleId,
    newScheduleId: req.newScheduleId,
    reason: req.reason,
    initiatedBy: req.initiatedBy,
    status: 'pending'
  });
  
  // 3. Release seats on original bus
  await releaseSeatReservations(booking.scheduleId, booking.seats);
  
  // 4. Allocate seats on new bus
  const newSeats = await allocateSeats(req.newScheduleId, booking.passengers.length);
  
  // 5. Update booking
  await db.bookings.update(req.bookingId, {
    scheduleId: req.newScheduleId,
    seats: newSeats,
    isTransferred: true,
    transferId: transfer.id
  });
  
  // 6. Calculate price adjustment
  const priceAdjustment = calculatePriceAdjustment(booking, newSchedule);
  
  // 7. Generate new QR code
  await regenerateBookingQR(req.bookingId);
  
  // 8. Notify customer
  if (req.notifyCustomer) {
    await sendTransferNotification(booking.userId, transfer, priceAdjustment);
  }
  
  // 9. Complete transfer
  await db.bookingTransfers.update(transfer.id, {
    status: 'completed',
    priceAdjustment,
    completedAt: new Date()
  });
  
  return { transfer, newSeats, priceAdjustment };
}
```

#### Admin UI Features
```
Booking Transfer Interface
┌──────────────────────────────────────────────────┐
│ Transfer Booking #12345                          │
├──────────────────────────────────────────────────┤
│ Current Bus: KAA 123C | Kampala-Mbarara        │
│ Departure: Jan 30, 2026 08:00 AM                │
│ Seats: 12A, 12B | Passengers: 2                 │
├──────────────────────────────────────────────────┤
│ Select New Bus:                                  │
│ ○ KAA 456D | Kampala-Mbarara | 09:00 AM        │
│   Available Seats: 15 | Price: +UGX 2,000      │
│                                                  │
│ ○ KAA 789E | Kampala-Mbarara | 10:30 AM        │
│   Available Seats: 20 | Price: Same            │
├──────────────────────────────────────────────────┤
│ Reason: [Dropdown: Wrong bus booked]            │
│ Notes: [Customer requested earlier departure]   │
│                                                  │
│ □ Notify customer via SMS                       │
│ □ Notify customer via email                     │
│                                                  │
│ Price Adjustment: +UGX 2,000                    │
│ ○ Charge customer  ○ Waive fee  ○ Refund       │
│                                                  │
│        [Cancel]        [Transfer Booking]       │
└──────────────────────────────────────────────────┘
```

#### Customer Notification
```
SMS: Your TransConnect booking #12345 has been transferred to bus KAA 456D departing at 09:00 AM on Jan 30. New seats: 15A, 15B. Your QR code has been updated. No additional charges. Questions? Call 0800-123-456.
```

**Priority**: High  
**Complexity**: High  
**Estimated Time**: 7-9 days  
**Testing Required**: Extensive workflow testing

---

## 6. DYNAMIC BUS ALLOCATION (ON-DEMAND ROUTING)

### Problem
Some operators don't pre-list all routes but allocate buses on-demand based on bookings. Need to:
- Allow booking without fixed schedules
- Dynamically assign buses
- Still track seat inventory

### Proposed Solution: Flexible Scheduling System

#### Database Schema
```sql
-- Add scheduling mode to routes
ALTER TABLE routes ADD COLUMN scheduling_mode VARCHAR(50) DEFAULT 'fixed';
-- Values: 'fixed', 'dynamic', 'hybrid'

-- New dynamic_route_pool table
CREATE TABLE dynamic_route_pools (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES routes(id) ON DELETE CASCADE,
  operator_id INTEGER REFERENCES operators(id),
  date DATE NOT NULL,
  min_passengers INTEGER DEFAULT 1,
  max_passengers INTEGER,
  cutoff_hours INTEGER DEFAULT 2, -- Hours before departure to assign bus
  status VARCHAR(50) DEFAULT 'accepting', -- accepting, assigned, cancelled
  assigned_bus_id INTEGER REFERENCES buses(id),
  assigned_schedule_id INTEGER REFERENCES bus_schedules(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(route_id, date)
);

-- Provisional bookings (before bus assigned)
CREATE TABLE provisional_bookings (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER REFERENCES dynamic_route_pools(id),
  user_id INTEGER REFERENCES users(id),
  passengers INTEGER NOT NULL,
  preferred_time TIME,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  total_price DECIMAL(10,2),
  payment_status VARCHAR(50) DEFAULT 'pending',
  status VARCHAR(50) DEFAULT 'provisional', -- provisional, confirmed, cancelled
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link provisional to actual booking after bus assignment
ALTER TABLE bookings ADD COLUMN provisional_booking_id INTEGER REFERENCES provisional_bookings(id);
```

#### Dynamic Allocation Workflow

**Phase 1: Customer Books (No Bus Assigned Yet)**
```typescript
async function createProvisionalBooking(request: BookingRequest) {
  // 1. Check if route supports dynamic scheduling
  const route = await getRoute(request.routeId);
  if (route.schedulingMode !== 'dynamic' && route.schedulingMode !== 'hybrid') {
    return createNormalBooking(request); // Use existing logic
  }
  
  // 2. Get or create dynamic pool for this date
  let pool = await db.dynamicRoutePools.findOne({
    routeId: request.routeId,
    date: request.date
  });
  
  if (!pool) {
    pool = await db.dynamicRoutePools.create({
      routeId: request.routeId,
      operatorId: route.operatorId,
      date: request.date,
      maxPassengers: route.defaultCapacity || 50
    });
  }
  
  // 3. Create provisional booking
  const provisional = await db.provisionalBookings.create({
    poolId: pool.id,
    userId: request.userId,
    passengers: request.passengers.length,
    fromLocation: request.origin,
    toLocation: request.destination,
    totalPrice: request.totalPrice,
    paymentStatus: 'pending'
  });
  
  // 4. Process payment
  const payment = await processPayment(provisional.id, request.paymentDetails);
  
  if (payment.status === 'success') {
    await db.provisionalBookings.update(provisional.id, {
      paymentStatus: 'paid'
    });
  }
  
  // 5. Check if should auto-assign bus
  const totalPassengers = await getTotalPassengersInPool(pool.id);
  if (totalPassengers >= pool.minPassengers) {
    await scheduleAutoAssignment(pool.id);
  }
  
  return { provisional, pool, requiresConfirmation: true };
}
```

**Phase 2: Auto-Assignment (Operator or System)**
```typescript
async function assignBusToPool(poolId: number, busId?: number) {
  const pool = await getPool(poolId);
  const provisionals = await getProvisionalBookings(poolId, { status: 'provisional' });
  
  // 1. Select bus (auto or manual)
  let bus = busId ? await getBus(busId) : await selectOptimalBus(pool);
  
  // 2. Create schedule
  const schedule = await db.busSchedules.create({
    busId: bus.id,
    routeId: pool.routeId,
    date: pool.date,
    departureTime: calculateOptimalDepartureTime(provisionals),
    availableSeats: bus.capacity,
    status: 'scheduled'
  });
  
  // 3. Convert provisional bookings to confirmed bookings
  for (const provisional of provisionals) {
    const seats = await allocateSeats(schedule.id, provisional.passengers);
    
    const booking = await db.bookings.create({
      userId: provisional.userId,
      scheduleId: schedule.id,
      seats: seats,
      totalPrice: provisional.totalPrice,
      paymentStatus: provisional.paymentStatus,
      provisionalBookingId: provisional.id,
      status: 'confirmed'
    });
    
    // Generate QR code
    await generateBookingQR(booking.id);
    
    // Update provisional
    await db.provisionalBookings.update(provisional.id, {
      status: 'confirmed'
    });
    
    // Notify customer
    await sendBusAssignmentNotification(provisional.userId, {
      booking,
      bus,
      schedule
    });
  }
  
  // 4. Update pool
  await db.dynamicRoutePools.update(poolId, {
    status: 'assigned',
    assignedBusId: bus.id,
    assignedScheduleId: schedule.id
  });
  
  return { schedule, confirmedBookings: provisionals.length };
}
```

**Phase 3: Auto-Assignment Trigger (Cron Job)**
```typescript
// Run hourly
async function processAutoAssignments() {
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() + 2); // 2 hours before departure
  
  const pendingPools = await db.dynamicRoutePools.findMany({
    status: 'accepting',
    date: { lte: cutoffTime },
    minPassengers: { lte: db.raw('(SELECT COUNT(*) FROM provisional_bookings WHERE pool_id = dynamic_route_pools.id)') }
  });
  
  for (const pool of pendingPools) {
    await assignBusToPool(pool.id);
  }
}
```

#### Admin UI for Dynamic Management
```
Dynamic Route Management
┌──────────────────────────────────────────────────┐
│ Route: Kampala → Mbarara                         │
│ Date: January 30, 2026                           │
│ Status: Accepting Bookings                       │
├──────────────────────────────────────────────────┤
│ Current Bookings: 18 passengers                  │
│ Minimum to Assign: 15 passengers    ✅ MET      │
│ Maximum Capacity: 50 passengers                  │
│                                                  │
│ Provisional Bookings:                            │
│ #1001 - 2 passengers - 08:00 AM preferred       │
│ #1002 - 3 passengers - 09:00 AM preferred       │
│ #1003 - 5 passengers - 10:00 AM preferred       │
│ #1004 - 8 passengers - 08:30 AM preferred       │
│                                                  │
│ Suggested Departure: 09:00 AM (based on average)│
│                                                  │
│ Available Buses:                                 │
│ ○ KAA 123C (52 seats, Rating: 4.5) [Select]    │
│ ○ KAA 456D (45 seats, Rating: 4.2) [Select]    │
│                                                  │
│ Auto-assign in: 1 hour 45 minutes              │
│                                                  │
│        [Assign Now]  [Cancel Pool]  [Extend]    │
└──────────────────────────────────────────────────┘
```

**Priority**: Medium (After core fixes)  
**Complexity**: Very High  
**Estimated Time**: 10-14 days  
**Dependencies**: Sections 3, 5 must be complete

---

## 7. SEAT DOUBLE-BOOKING PREVENTION

### Problem
Need robust system to prevent same seat being booked twice.

### Current Implementation Review
Let me check if there are existing constraints...

### Enhanced Solution: Multi-Layer Protection

#### Database Level
```sql
-- Add unique constraint on seat assignments
CREATE TABLE booking_seats (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  schedule_id INTEGER REFERENCES bus_schedules(id) ON DELETE CASCADE,
  seat_number VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'reserved', -- reserved, released, transferred
  reserved_at TIMESTAMP DEFAULT NOW(),
  released_at TIMESTAMP,
  UNIQUE(schedule_id, seat_number, status) WHERE status = 'reserved'
  -- Partial unique index: prevents duplicate reserved seats on same schedule
);

-- Index for fast lookups
CREATE INDEX idx_booking_seats_schedule ON booking_seats(schedule_id, status);
```

#### Application Level: Pessimistic Locking
```typescript
async function reserveSeats(scheduleId: number, seatNumbers: string[]) {
  return await db.transaction(async (tx) => {
    // 1. Lock the schedule row
    const schedule = await tx.busSchedules.findOne({
      where: { id: scheduleId },
      lock: 'FOR UPDATE' // PostgreSQL row-level lock
    });
    
    // 2. Check current reservations with lock
    const reservedSeats = await tx.bookingSeats.findMany({
      where: {
        scheduleId: scheduleId,
        status: 'reserved',
        seatNumber: { in: seatNumbers }
      },
      lock: 'FOR UPDATE'
    });
    
    if (reservedSeats.length > 0) {
      throw new Error(`Seats already booked: ${reservedSeats.map(s => s.seatNumber).join(', ')}`);
    }
    
    // 3. Create reservations
    const reservations = await tx.bookingSeats.createMany({
      data: seatNumbers.map(seat => ({
        scheduleId,
        seatNumber: seat,
        status: 'reserved'
      }))
    });
    
    // 4. Update available count
    await tx.busSchedules.update({
      where: { id: scheduleId },
      data: {
        availableSeats: { decrement: seatNumbers.length }
      }
    });
    
    return reservations;
  });
}
```

#### Redis-Based Seat Lock (Optional - High Volume)
```typescript
// For high-traffic scenarios
class SeatLockManager {
  private redis: Redis;
  private lockTTL = 300; // 5 minutes
  
  async acquireSeatLock(scheduleId: number, seatNumber: string): Promise<boolean> {
    const key = `seat:lock:${scheduleId}:${seatNumber}`;
    const acquired = await this.redis.set(key, '1', 'EX', this.lockTTL, 'NX');
    return acquired !== null;
  }
  
  async releaseSeatLock(scheduleId: number, seatNumber: string): Promise<void> {
    const key = `seat:lock:${scheduleId}:${seatNumber}`;
    await this.redis.del(key);
  }
  
  async withSeatLock<T>(
    scheduleId: number, 
    seatNumbers: string[], 
    callback: () => Promise<T>
  ): Promise<T> {
    // Try to acquire all locks
    const locks = await Promise.all(
      seatNumbers.map(seat => this.acquireSeatLock(scheduleId, seat))
    );
    
    if (!locks.every(locked => locked)) {
      // Release acquired locks
      await Promise.all(
        seatNumbers.map(seat => this.releaseSeatLock(scheduleId, seat))
      );
      throw new Error('Could not acquire seat locks - seats may be in use');
    }
    
    try {
      return await callback();
    } finally {
      // Always release locks
      await Promise.all(
        seatNumbers.map(seat => this.releaseSeatLock(scheduleId, seat))
      );
    }
  }
}
```

#### Real-Time Seat Updates (WebSocket)
```typescript
// Broadcast seat availability changes
async function updateSeatAvailability(scheduleId: number) {
  const availableSeats = await getAvailableSeats(scheduleId);
  
  // Broadcast to all clients viewing this schedule
  io.to(`schedule:${scheduleId}`).emit('seats:updated', {
    scheduleId,
    availableSeats,
    timestamp: new Date()
  });
}
```

#### Mobile App: Seat Locking Flow
```typescript
// When user selects seats
async function selectSeats(scheduleId: number, seats: string[]) {
  // 1. Request temporary lock (30 seconds)
  const lockResponse = await api.post('/bookings/lock-seats', {
    scheduleId,
    seats,
    ttl: 30
  });
  
  if (!lockResponse.success) {
    showError('These seats are no longer available');
    return;
  }
  
  // 2. Start countdown timer
  startSeatLockTimer(30, () => {
    showWarning('Seat selection expiring soon!');
  });
  
  // 3. User proceeds to payment
  // Locks auto-released if payment not completed in 30s
}
```

**Priority**: Critical  
**Complexity**: Medium  
**Estimated Time**: 4-5 days  
**Testing Required**: Concurrent booking stress tests

---

## 8. COMPREHENSIVE BOOKING & BUS MANAGER

### Overview
Combine all the above features into a unified management interface for TransConnect Managers.

#### Features
1. **Live Dashboard**
   - Real-time bookings by route
   - Bus utilization metrics
   - Dynamic pool status
   - Transfer requests pending
   
2. **Booking Management**
   - Search any booking
   - View booking history
   - Initiate transfers
   - Process refunds
   - Handle cancellations

3. **Bus Assignment**
   - View available buses
   - Assign to dynamic pools
   - Handle last-minute changes
   - Track maintenance schedules

4. **Seat Inventory**
   - Real-time seat maps for all schedules
   - Double-booking alerts
   - Capacity forecasting
   - Overbooking management (if permitted)

5. **Reporting**
   - Daily booking reports
   - Revenue by route
   - Operator performance
   - Transfer statistics

#### Tech Stack for Manager UI
- React Admin Dashboard (existing)
- Real-time updates via Socket.io
- Data visualization with Chart.js
- Export reports to Excel/PDF

**Priority**: High  
**Complexity**: High (Integration of all features)  
**Estimated Time**: 14-21 days  
**Dependencies**: All sections above

---

## IMPLEMENTATION ROADMAP

### Phase 1: Critical Fixes (2-3 weeks)
**Goal**: Address immediate production pain points

1. **Week 1**
   - [ ] Stopover as searchable destinations (Section 3)
   - [ ] Route segments and pricing (Section 4)
   - [ ] Database migrations and API updates

2. **Week 2**
   - [ ] Automated distance/duration calculation (Section 2)
   - [ ] Double-booking prevention (Section 7)
   - [ ] Admin UI for new features

3. **Week 3**
   - [ ] Booking transfer system (Section 5)
   - [ ] User role management (Section 1)
   - [ ] Testing and bug fixes

**Deliverables**: Production-ready fixes for field team issues

### Phase 2: Dynamic Scheduling (3-4 weeks)
**Goal**: Implement on-demand bus allocation

1. **Week 4-5**
   - [ ] Dynamic route pool system (Section 6)
   - [ ] Provisional booking workflow
   - [ ] Auto-assignment logic

2. **Week 6-7**
   - [ ] Admin UI for dynamic management
   - [ ] Customer notifications
   - [ ] Integration testing

**Deliverables**: Fully functional dynamic scheduling system

### Phase 3: Unified Manager Interface (2-3 weeks)
**Goal**: Comprehensive management dashboard

1. **Week 8-9**
   - [ ] Manager dashboard design and implementation
   - [ ] Real-time updates
   - [ ] Reporting and analytics

2. **Week 10**
   - [ ] User acceptance testing
   - [ ] Training materials
   - [ ] Production deployment

**Deliverables**: Complete Booking & Bus Manager system

---

## RISK ASSESSMENT

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration issues | High | Medium | Test on staging, rollback plan |
| Performance degradation with segments | Medium | Medium | Optimize queries, add indexes |
| Race conditions in seat booking | High | Low | Transaction locks, Redis backup |
| API breaking changes | High | Low | Version APIs, backwards compatibility |
| Google Maps API costs | Low | Medium | Cache aggressively, monitor usage |

### Operational Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Field team resistance to new UI | Medium | Medium | Training, gradual rollout |
| Customer confusion with transfers | Medium | Low | Clear communications, support ready |
| Dynamic scheduling complexity | High | Medium | Start with pilot operators |
| Price calculation errors | High | Low | Extensive testing, manual override option |

---

## COST ESTIMATES

### Development Costs
- Senior Developer (8-10 weeks): ~$20,000 - $30,000
- QA Testing (2-3 weeks): ~$5,000 - $8,000
- DevOps/Infrastructure: ~$2,000 - $3,000

### Infrastructure Costs (Monthly)
- Google Maps Distance Matrix API: ~$50-200 (depends on usage)
- Redis for seat locking (optional): ~$15-30
- Additional database resources: ~$20-50
- Increased server capacity: ~$50-100

**Total Estimated Cost**: $27,000 - $41,000 + $135-380/month ongoing

---

## SUCCESS METRICS

### Phase 1 Success Criteria
- [ ] Route creation time reduced by 70% (no manual distance entry)
- [ ] Stopover searches return results 100% of the time
- [ ] Zero double-booking incidents
- [ ] Booking transfers completed within 5 minutes average
- [ ] 95% customer satisfaction with transfer process

### Phase 2 Success Criteria
- [ ] 30% of operators using dynamic scheduling
- [ ] Average bus utilization increased by 15%
- [ ] Provisional bookings converted to confirmed within 24 hours
- [ ] Zero payment issues with dynamic bookings

### Phase 3 Success Criteria
- [ ] Manager dashboard used daily by 100% of staff
- [ ] Booking management tasks completed 50% faster
- [ ] 95% accuracy in automated bus assignments
- [ ] Weekly reports generated automatically

---

## QUESTIONS FOR REVIEW

1. **Stopover Pricing**: Should operators be able to set different prices for the same segment on different dates (e.g., weekend premium)?

2. **Dynamic Scheduling**: What's the minimum passenger threshold to make a trip viable? Should this vary by route?

3. **Transfer Policy**: Who absorbs the cost if new bus is more expensive? Should there be a transfer fee?

4. **Double Booking**: Do you want the system to allow overbooking (common in transportation) with a percentage buffer?

5. **Priority**: Should we tackle these in the order presented, or would you like to prioritize differently based on field urgency?

6. **Testing**: Do you have a staging environment where we can test these changes before production?

7. **Training**: Do you need training materials/videos for the field team on new features?

8. **Migration**: Can we schedule a maintenance window for database migrations, or need zero-downtime approach?

---

## NEXT STEPS

1. **Review this plan** and provide feedback on priorities and approach
2. **Answer questions** above to clarify requirements
3. **Approve budget** and timeline
4. **Set up staging environment** for testing
5. **Begin Phase 1** implementation

---

**Document Owner**: GitHub Copilot  
**Reviewers**: [To be assigned]  
**Approval Date**: [Pending review]  
**Start Date**: [After approval]

