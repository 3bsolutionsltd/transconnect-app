import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, canAccessAllOperationsBookings, getScopedOperatorIdsForUser } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import QRCode from 'qrcode';
import { NotificationService } from '../services/notification.service';

const router = Router();
const notificationService = NotificationService.getInstance();

const OPERATIONS_ROLES = ['ADMIN', 'MANAGER', 'MASTER_FIELD_OPERATOR', 'OPERATOR_FIELD_OPERATOR'];

const createLedgerEntry = async (payload: {
  bookingId: string;
  actorUserId?: string;
  operatorId?: string;
  action: string;
  actorRole: string;
  note?: string;
  metadata?: any;
}) => {
  return prisma.bookingLedgerEntry.create({
    data: {
      bookingId: payload.bookingId,
      actorUserId: payload.actorUserId,
      operatorId: payload.operatorId,
      action: payload.action,
      actorRole: payload.actorRole,
      note: payload.note,
      metadata: payload.metadata,
    },
  });
};

const getOperationsAccess = async (requestUser: { id: string; role: string }, requestedOperatorId?: string) => {
  if (!OPERATIONS_ROLES.includes(requestUser.role)) {
    return { allowed: false, scopedOperatorIds: [] as string[] };
  }

  if (canAccessAllOperationsBookings(requestUser.role)) {
    return { allowed: true, scopedOperatorIds: null as string[] | null };
  }

  const scopedOperatorIds = await getScopedOperatorIdsForUser(requestUser.id, requestUser.role);
  if (!scopedOperatorIds || scopedOperatorIds.length === 0) {
    return { allowed: false, scopedOperatorIds: [] as string[] };
  }

  if (requestedOperatorId && !scopedOperatorIds.includes(requestedOperatorId)) {
    return { allowed: false, scopedOperatorIds };
  }

  return { allowed: true, scopedOperatorIds };
};

// ── ADMIN: all bookings with pagination and filters ────────────────────────
router.get('/admin/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;

    const {
      page = '1',
      limit = '50',
      status,
      operatorId,
      paymentStatus,
      paymentMethod,
      dateFrom,
      dateTo,
      search,        // passenger name / booking ID
    } = req.query;

    const access = await getOperationsAccess(requestUser, operatorId as string | undefined);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Operations access required for bookings' });
    }

    const pageNum  = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string)));
    const skip     = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (status)      where.status = status;
    if (dateFrom || dateTo) {
      where.travelDate = {};
      if (dateFrom) where.travelDate.gte = new Date(dateFrom as string);
      if (dateTo)   where.travelDate.lte = new Date(dateTo as string);
    }
    if (operatorId) {
      where.route = { operatorId };
    } else if (access.scopedOperatorIds) {
      where.route = { operatorId: { in: access.scopedOperatorIds } };
    }
    if (paymentStatus || paymentMethod) {
      where.payment = {
        is: {
          ...(paymentStatus && { status: paymentStatus }),
          ...(paymentMethod && { method: paymentMethod }),
        },
      };
    }
    if (search) {
      // Search by booking ID prefix or passenger details via join
      where.OR = [
        { id: { startsWith: search as string } },
        { user: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { user: { lastName:  { contains: search as string, mode: 'insensitive' } } },
        { user: { phone:     { contains: search as string } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          route: {
            include: {
              operator: { select: { id: true, companyName: true } },
              bus:      { select: { plateNumber: true, model: true } },
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          payment: {
            select: { id: true, status: true, method: true, amount: true, reference: true, createdAt: true },
          },
          assignments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              agent: { select: { id: true, name: true, phone: true, status: true } },
              assignedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    // Aggregate stats for the filtered set
    const revenueAgg = await prisma.payment.aggregate({
      where: { booking: where, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const totalRevenue = revenueAgg._sum.amount || 0;

    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      stats: {
        total,
        totalRevenue,
        byStatus: Object.fromEntries(statusCounts.map(s => [s.status, s._count.status])),
      },
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ── ADMIN: analytics summary for dashboard and reports ─────────────────────
router.get('/admin/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    const { windowDays = '30' } = req.query;

    const access = await getOperationsAccess(requestUser);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Operations access required for analytics' });
    }

    const parsedWindowDays = Number(windowDays);
    const safeWindowDays = Number.isFinite(parsedWindowDays)
      ? Math.max(7, Math.min(180, Math.floor(parsedWindowDays)))
      : 30;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - safeWindowDays);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const routeScope = access.scopedOperatorIds
      ? { operatorId: { in: access.scopedOperatorIds } }
      : undefined;

    const bookingScope = routeScope ? { route: routeScope } : {};

    const [
      totalBookings,
      totalPassengers,
      activeRoutes,
      todayBookings,
      monthlyRevenueAgg,
      totalRevenueAgg,
      firstBookingRows,
      repeatRows,
      activePassengerRows,
      recentBookings,
      topRouteGroups,
      routeMeta,
      dailyBookingEvents,
    ] = await Promise.all([
      prisma.booking.count({ where: bookingScope }),
      prisma.user.count({ where: { role: 'PASSENGER' } }),
      prisma.route.count({ where: { active: true, ...(routeScope || {}) } }),
      prisma.booking.count({
        where: {
          ...bookingScope,
          createdAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: monthStart },
          ...(routeScope ? { booking: { route: routeScope } } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          ...(routeScope ? { booking: { route: routeScope } } : {}),
        },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<Array<{ total_new_passengers: number; with_first_booking: number }>>`
        WITH new_passengers AS (
          SELECT u.id
          FROM users u
          WHERE u.role = 'PASSENGER'
            AND u."createdAt" >= ${startDate}
        )
        SELECT
          COUNT(*)::int AS total_new_passengers,
          COUNT(b.user_id)::int AS with_first_booking
        FROM new_passengers np
        LEFT JOIN LATERAL (
          SELECT b."userId" AS user_id
          FROM bookings b
          WHERE b."userId" = np.id
          LIMIT 1
        ) b ON true
      `,
      prisma.$queryRaw<Array<{ passengers_with_first_booking: number; repeaters_within_30d: number }>>`
        WITH passenger_first AS (
          SELECT b."userId", MIN(b."createdAt") AS first_booking_at
          FROM bookings b
          INNER JOIN users u ON u.id = b."userId"
          WHERE u.role = 'PASSENGER'
          GROUP BY b."userId"
        )
        SELECT
          COUNT(*)::int AS passengers_with_first_booking,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1
              FROM bookings b2
              WHERE b2."userId" = pf."userId"
                AND b2."createdAt" > pf.first_booking_at
                AND b2."createdAt" <= pf.first_booking_at + INTERVAL '30 days'
            )
          )::int AS repeaters_within_30d
        FROM passenger_first pf
      `,
      prisma.$queryRaw<Array<{ active_passengers: number; average_bookings_per_active_passenger: number }>>`
        WITH active_passenger_bookings AS (
          SELECT b."userId", COUNT(*)::int AS booking_count
          FROM bookings b
          INNER JOIN users u ON u.id = b."userId"
          WHERE u.role = 'PASSENGER'
            AND b."createdAt" >= ${startDate}
          GROUP BY b."userId"
        )
        SELECT
          COUNT(*)::int AS active_passengers,
          COALESCE(AVG(booking_count)::float, 0)::float AS average_bookings_per_active_passenger
        FROM active_passenger_bookings
      `,
      prisma.booking.findMany({
        where: bookingScope,
        include: {
          user: {
            select: { firstName: true, lastName: true, phone: true },
          },
          route: {
            select: {
              origin: true,
              destination: true,
              departureTime: true,
              operator: { select: { companyName: true } },
            },
          },
          payment: {
            select: { status: true, amount: true, method: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.booking.groupBy({
        by: ['routeId'],
        where: {
          ...bookingScope,
          createdAt: { gte: startDate },
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: { _count: { routeId: 'desc' } },
        take: 5,
      }),
      prisma.route.findMany({
        where: routeScope || {},
        select: { id: true, origin: true, destination: true },
      }),
      prisma.booking.findMany({
        where: {
          ...bookingScope,
          createdAt: { gte: startDate },
        },
        select: { createdAt: true },
      }),
    ]);

    const firstBookingBase = firstBookingRows[0] || { total_new_passengers: 0, with_first_booking: 0 };
    const repeatBase = repeatRows[0] || { passengers_with_first_booking: 0, repeaters_within_30d: 0 };
    const activeBase = activePassengerRows[0] || {
      active_passengers: 0,
      average_bookings_per_active_passenger: 0,
    };

    const firstBookingRate = firstBookingBase.total_new_passengers > 0
      ? (firstBookingBase.with_first_booking / firstBookingBase.total_new_passengers) * 100
      : 0;

    const repeat30DayRate = repeatBase.passengers_with_first_booking > 0
      ? (repeatBase.repeaters_within_30d / repeatBase.passengers_with_first_booking) * 100
      : 0;

    const routeLookup = new Map(routeMeta.map(route => [route.id, route]));
    const routePerformance = topRouteGroups.map(group => {
      const route = routeLookup.get(group.routeId);
      return {
        routeId: group.routeId,
        route: route ? `${route.origin} → ${route.destination}` : group.routeId,
        bookings: group._count._all,
        revenue: group._sum.totalAmount || 0,
      };
    });

    const dailyBookingMap = new Map<string, number>();
    for (const event of dailyBookingEvents) {
      const day = event.createdAt.toISOString().split('T')[0];
      dailyBookingMap.set(day, (dailyBookingMap.get(day) || 0) + 1);
    }

    const dailyBookings = Array.from(dailyBookingMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, bookings]) => ({ day, bookings }));

    const popularRoute = routePerformance.length > 0 ? routePerformance[0].route : '—';

    res.json({
      overview: {
        totalBookings,
        totalRevenue: totalRevenueAgg._sum.amount || 0,
        activeRoutes,
        totalPassengers,
        todayBookings,
        monthlyRevenue: monthlyRevenueAgg._sum.amount || 0,
        popularRoute,
      },
      funnel: {
        windowDays: safeWindowDays,
        newPassengerSignups: firstBookingBase.total_new_passengers,
        newPassengersWithFirstBooking: firstBookingBase.with_first_booking,
        firstBookingRate,
        repeat30DayRate,
        activePassengerCount: activeBase.active_passengers,
        averageBookingsPerActivePassenger: activeBase.average_bookings_per_active_passenger,
      },
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        passenger: `${booking.user?.firstName || ''} ${booking.user?.lastName || ''}`.trim(),
        passengerPhone: booking.user?.phone || '',
        route: `${booking.route?.origin || ''} → ${booking.route?.destination || ''}`.trim(),
        amount: booking.payment?.amount || booking.totalAmount || 0,
        status: booking.status,
        paymentStatus: booking.payment?.status || 'NO_PAYMENT',
        createdAt: booking.createdAt,
        travelDate: booking.travelDate,
        seatNumber: booking.seatNumber,
        operator: booking.route?.operator?.companyName || '',
      })),
      routePerformance,
      dailyBookings,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
});

// ── ADMIN: confirm a cash payment manually ────────────────────────────────
router.post('/admin/confirm-payment/:bookingId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    const { bookingId } = req.params;

    const access = await getOperationsAccess(requestUser);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Operations access required for cash confirmation' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, route: { select: { operatorId: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (access.scopedOperatorIds && !access.scopedOperatorIds.includes(booking.route.operatorId)) {
      return res.status(403).json({ error: 'Booking is outside your operator scope' });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending bookings can be confirmed as cash' });
    }

    if (booking.payment && booking.payment.method !== 'CASH') {
      return res.status(400).json({ error: 'Only cash bookings can be confirmed with this action' });
    }

    await prisma.$transaction([
      prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } }),
      ...(booking.payment
        ? [prisma.payment.update({ where: { id: booking.payment.id }, data: { status: 'COMPLETED' } })]
        : [
            prisma.payment.create({
              data: {
                bookingId: booking.id,
                userId: booking.userId,
                amount: booking.totalAmount,
                method: 'CASH',
                status: 'COMPLETED',
                reference: `CASH-${booking.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`,
              },
            }),
          ]),
      prisma.bookingLedgerEntry.create({
        data: {
          bookingId: booking.id,
          actorUserId: requestUser.id,
          operatorId: booking.route.operatorId,
          action: 'CASH_CONFIRMED',
          actorRole: requestUser.role,
          note: 'Cash payment confirmed from operations bookings page',
        },
      }),
    ]);

    res.json({ success: true, message: 'Booking confirmed and payment marked complete' });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Operations: assign booking to an agent / brand ambassador
router.post('/:bookingId/assign-agent', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    const { bookingId } = req.params;
    const { agentId, note } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: 'agentId is required' });
    }

    const access = await getOperationsAccess(requestUser);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Operations access required for assignments' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: { select: { operatorId: true, origin: true, destination: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (access.scopedOperatorIds && !access.scopedOperatorIds.includes(booking.route.operatorId)) {
      return res.status(403).json({ error: 'Booking is outside your operator scope' });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const assignment = await prisma.$transaction(async tx => {
      const createdAssignment = await tx.bookingAssignment.create({
        data: {
          bookingId,
          agentId,
          assignedByUserId: requestUser.id,
          operatorId: booking.route.operatorId,
          note,
        },
        include: {
          agent: { select: { id: true, name: true, phone: true, status: true } },
          assignedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      });

      await tx.bookingLedgerEntry.create({
        data: {
          bookingId,
          actorUserId: requestUser.id,
          operatorId: booking.route.operatorId,
          action: 'ASSIGNED_TO_AGENT',
          actorRole: requestUser.role,
          note: note || `Assigned to ${agent.name}`,
          metadata: {
            agentId: agent.id,
            agentName: agent.name,
            route: `${booking.route.origin} -> ${booking.route.destination}`,
          },
        },
      });

      return createdAssignment;
    });

    res.status(201).json({ assignment });
  } catch (error: any) {
    console.error('Error assigning booking to agent:', error);
    res.status(500).json({ error: error.message || 'Failed to assign booking to agent' });
  }
});

// Operations: get booking ledger
router.get('/:bookingId/ledger', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    const { bookingId } = req.params;

    const access = await getOperationsAccess(requestUser);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Operations access required for ledger access' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        route: { select: { operatorId: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (access.scopedOperatorIds && !access.scopedOperatorIds.includes(booking.route.operatorId)) {
      return res.status(403).json({ error: 'Booking is outside your operator scope' });
    }

    const entries = await prisma.bookingLedgerEntry.findMany({
      where: { bookingId },
      include: {
        actorUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        operator: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ entries });
  } catch (error: any) {
    console.error('Error fetching booking ledger:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch booking ledger' });
  }
});

// Operations: add booking ledger note
router.post('/:bookingId/ledger', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    const { bookingId } = req.params;
    const { note, action = 'FOLLOW_UP_NOTE', metadata } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }

    const access = await getOperationsAccess(requestUser);
    if (!access.allowed) {
      return res.status(403).json({ error: 'Operations access required for ledger updates' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        route: { select: { operatorId: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (access.scopedOperatorIds && !access.scopedOperatorIds.includes(booking.route.operatorId)) {
      return res.status(403).json({ error: 'Booking is outside your operator scope' });
    }

    const entry = await createLedgerEntry({
      bookingId,
      actorUserId: requestUser.id,
      operatorId: booking.route.operatorId,
      action,
      actorRole: requestUser.role,
      note,
      metadata,
    });

    res.status(201).json({ entry });
  } catch (error: any) {
    console.error('Error adding booking ledger entry:', error);
    res.status(500).json({ error: error.message || 'Failed to add booking ledger entry' });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        route: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                model: true,
                capacity: true
              }
            },
            operator: {
              select: {
                companyName: true
              }
            },
            stops: {
              orderBy: { order: 'asc' }
            }
          }
        },
        payment: {
          select: {
            amount: true,
            method: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a new booking
router.post('/', [
  authenticateToken,
  body('routeId').notEmpty().withMessage('Route ID is required'),
  body('seatNumbers').isArray({ min: 1 }).withMessage('At least one seat number is required'),
  body('travelDate').isISO8601().withMessage('Valid travel date is required'),
  body('passengers').isArray({ min: 1 }).withMessage('Passenger details are required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      routeId, 
      seatNumbers, 
      travelDate, 
      passengers,
      boardingStop,
      alightingStop 
    } = req.body;
    const userId = (req as any).user.id;

    // Validate seat count matches passenger count
    if (seatNumbers.length !== passengers.length) {
      return res.status(400).json({ 
        error: 'Number of seats must match number of passengers' 
      });
    }

    // Check if route exists and is active
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        bus: true,
        operator: true,
        stops: {
          orderBy: { order: 'asc' }
        },
        bookings: {
          where: {
            travelDate: new Date(travelDate),
            status: { in: ['PENDING', 'CONFIRMED'] }
          }
        }
      }
    });

    if (!route || !route.active) {
      return res.status(404).json({ error: 'Route not found or inactive' });
    }

    // Validate stops and calculate pricing
    let finalPrice = route.price;
    let boarding: any = null;
    let alighting: any = null;

    if (boardingStop || alightingStop) {
      if (!boardingStop || !alightingStop || route.stops.length === 0) {
        return res.status(400).json({
          error: 'Boarding and alighting stops are not configured for this route'
        });
      }

      boarding = route.stops.find(stop => stop.stopName === boardingStop);
      alighting = route.stops.find(stop => stop.stopName === alightingStop);

      if (!boarding || !alighting) {
        return res.status(400).json({ error: 'Invalid boarding or alighting stop' });
      }

      if (boarding.order >= alighting.order) {
        return res.status(400).json({ error: 'Boarding stop must be before alighting stop' });
      }

      finalPrice = alighting.priceFromOrigin - boarding.priceFromOrigin;
    }

    // Check seat availability
    for (const seatNumber of seatNumbers) {
      const existingBooking = await prisma.booking.findFirst({
        where: {
          routeId,
          seatNumber: seatNumber,
          travelDate: new Date(travelDate),
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      });

      if (existingBooking) {
        return res.status(400).json({ 
          error: `Seat ${seatNumber} is already booked for this date` 
        });
      }

      // Validate seat number against bus capacity
      const seatNum = parseInt(seatNumber);
      if (isNaN(seatNum) || seatNum < 1 || seatNum > route.bus.capacity) {
        return res.status(400).json({ 
          error: `Invalid seat number ${seatNumber} for this bus` 
        });
      }
    }

    // Create bookings for each passenger
    const bookings: any[] = [];
    
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const seatNumber = seatNumbers[i];

      // Create booking first so we have the ID for the QR URL
      const booking = await prisma.booking.create({
        data: {
          userId,
          routeId,
          seatNumber: seatNumber,
          travelDate: new Date(travelDate),
          qrCode: '',  // updated below once we have the booking ID
          totalAmount: finalPrice,
          boardingStop: boardingStop || null,
          alightingStop: alightingStop || null,
          actualPrice: finalPrice,
          status: 'PENDING'
        }
      });

      // Generate QR code as a clickable URL so phone cameras open the ticket page
      const frontendUrl = process.env.FRONTEND_URL || 'https://transconnect.app';
      const qrCode = await QRCode.toDataURL(`${frontendUrl}/ticket/${booking.id}`);
      await prisma.booking.update({ where: { id: booking.id }, data: { qrCode } });

      bookings.push({ ...booking, qrCode });
    }

    // Fetch complete booking data with relations
    const completeBookings = await prisma.booking.findMany({
      where: {
        id: { in: bookings.map(b => b.id) }
      },
      include: {
        route: {
          include: {
            bus: true,
            operator: true
          }
        },
        user: true
      }
    });

    // Send booking confirmation notification for the primary passenger
    try {
      const primaryBooking = completeBookings[0];
      await notificationService.sendBookingConfirmation({
        userId: primaryBooking.userId,
        bookingId: primaryBooking.id,
        passengerName: `${primaryBooking.user.firstName} ${primaryBooking.user.lastName}`,
        route: boardingStop && alightingStop 
          ? `${boardingStop} to ${alightingStop}` 
          : `${primaryBooking.route.origin} to ${primaryBooking.route.destination}`,
        date: primaryBooking.travelDate.toLocaleDateString(),
        time: primaryBooking.route.departureTime,
        seatNumber: seatNumbers.join(', '),
        amount: finalPrice * seatNumbers.length,
        qrCode: primaryBooking.id,
      });
    } catch (notificationError) {
      console.error('Error sending booking confirmation notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      bookings: completeBookings,
      summary: {
        totalSeats: seatNumbers.length,
        pricePerSeat: finalPrice,
        totalAmount: finalPrice * seatNumbers.length,
        route: boardingStop && alightingStop 
          ? `${boardingStop} → ${alightingStop}` 
          : `${route.origin} → ${route.destination}`
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get available seats for a route on a specific date
router.get('/route/:routeId/seats', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const { travelDate } = req.query;

    if (!travelDate) {
      return res.status(400).json({ error: 'Travel date is required' });
    }

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        bus: true,
        bookings: {
          where: {
            travelDate: new Date(travelDate as string),
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          select: {
            seatNumber: true,
            status: true
          }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const totalSeats = route.bus.capacity;
    const bookedSeats = route.bookings.map(booking => booking.seatNumber);
    const availableSeats: string[] = [];

    for (let i = 1; i <= totalSeats; i++) {
      const seatNumber = i.toString();
      if (!bookedSeats.includes(seatNumber)) {
        availableSeats.push(seatNumber);
      }
    }

    res.json({
      totalSeats,
      availableSeats,
      bookedSeats,
      seatMap: Array.from({ length: totalSeats }, (_, i) => ({
        seatNumber: (i + 1).toString(),
        isAvailable: !bookedSeats.includes((i + 1).toString())
      }))
    });
  } catch (error) {
    console.error('Error fetching seat availability:', error);
    res.status(500).json({ error: 'Failed to fetch seat availability' });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        route: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Check if cancellation is allowed (e.g., not too close to departure)
    const travelDate = new Date(booking.travelDate);
    const now = new Date();
    const hoursUntilTravel = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Allow cancellation of expired bookings (negative hours) or bookings with 2+ hours remaining
    // Only block cancellations that are within 2 hours of future travel
    if (hoursUntilTravel > 0 && hoursUntilTravel < 2) {
      return res.status(400).json({ error: 'Cannot cancel booking less than 2 hours before travel' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Get booking details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            bus: true,
            operator: true,
            stops: {
              orderBy: { order: 'asc' }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        payment: true,
        verification: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

export default router;