import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import QRCode from 'qrcode';
import { NotificationService } from '../services/notification.service';

const router = Router();
const notificationService = NotificationService.getInstance();

// ── ADMIN: all bookings with pagination and filters ────────────────────────
router.get('/admin/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    if (requestUser.role !== 'ADMIN' && requestUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Admin access required' });
    }

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

// ── ADMIN: confirm a cash payment manually ────────────────────────────────
router.post('/admin/confirm-payment/:bookingId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const requestUser = (req as any).user;
    if (requestUser.role !== 'ADMIN' && requestUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

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
    ]);

    res.json({ success: true, message: 'Booking confirmed and payment marked complete' });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
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

    if (boardingStop && alightingStop && route.stops.length > 0) {
      boarding = route.stops.find(stop => stop.stopName === boardingStop);
      alighting = route.stops.find(stop => stop.stopName === alightingStop);

      if (boarding && alighting) {
        if (boarding.order >= alighting.order) {
          return res.status(400).json({ error: 'Boarding stop must be before alighting stop' });
        }
        // Calculate price based on stops
        finalPrice = alighting.priceFromOrigin - boarding.priceFromOrigin;
      }
      // If stops not found in DB (e.g. fallback names), use full route price silently
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