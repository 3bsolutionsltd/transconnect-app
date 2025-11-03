import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import QRCode from 'qrcode';

const router = Router();

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
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
  body('seatNumber').notEmpty().withMessage('Seat number is required'),
  body('travelDate').isISO8601().withMessage('Valid travel date is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { routeId, seatNumber, travelDate } = req.body;
    const userId = (req as any).user.userId;

    // Check if route exists and is active
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        bus: true,
        operator: true,
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

    // Check if seat is available for the specific travel date
    const existingBooking = await prisma.booking.findFirst({
      where: {
        routeId,
        seatNumber: seatNumber,
        travelDate: new Date(travelDate),
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'Seat is already booked for this date' });
    }

    // Validate seat number against bus capacity
    const seatNum = parseInt(seatNumber);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > route.bus.capacity) {
      return res.status(400).json({ error: 'Invalid seat number for this bus' });
    }

    // Generate QR code data
    const qrData = {
      routeId: routeId,
      seatNumber: seatNumber,
      travelDate: travelDate,
      route: `${route.origin} → ${route.destination}`,
      busPlate: route.bus.plateNumber,
      timestamp: Date.now()
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        routeId,
        seatNumber: seatNumber,
        travelDate: new Date(travelDate),
        qrCode,
        totalAmount: route.price,
        status: 'PENDING'
      },
      include: {
        route: {
          include: {
            bus: true,
            operator: true
          }
        }
      }
    });

    res.status(201).json(booking);
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
    const userId = (req as any).user.userId;

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

    if (hoursUntilTravel < 2) {
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
    const userId = (req as any).user.userId;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            bus: true,
            operator: true
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