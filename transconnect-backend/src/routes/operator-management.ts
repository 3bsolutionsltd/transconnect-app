import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = Router();

// Get all bookings for operator's routes
router.get('/bookings', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { page = 1, limit = 10, status, date, routeId } = req.query;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Build where clause
    const whereClause: any = {
      route: {
        operatorId: operator.id
      }
    };

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      const searchDate = new Date(date as string);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.travelDate = {
        gte: searchDate,
        lt: nextDay
      };
    }

    if (routeId) {
      whereClause.routeId = routeId;
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        route: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                model: true,
                capacity: true
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            amount: true,
            reference: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.booking.count({
      where: whereClause
    });

    res.json({
      bookings: bookings.map(booking => ({
        id: booking.id,
        seatNumber: booking.seatNumber,
        status: booking.status,
        totalAmount: booking.totalAmount,
        travelDate: booking.travelDate,
        createdAt: booking.createdAt,
        passenger: {
          name: `${booking.user.firstName} ${booking.user.lastName}`,
          phone: booking.user.phone,
          email: booking.user.email
        },
        route: {
          id: booking.route.id,
          origin: booking.route.origin,
          destination: booking.route.destination,
          departureTime: booking.route.departureTime,
          price: booking.route.price
        },
        bus: {
          plateNumber: booking.route.bus.plateNumber,
          model: booking.route.bus.model,
          capacity: booking.route.bus.capacity
        },
        payment: booking.payment && Array.isArray(booking.payment) && booking.payment.length > 0 ? {
          status: booking.payment[0].status,
          method: booking.payment[0].method,
          reference: booking.payment[0].reference
        } : null,
        qrCode: booking.qrCode
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      summary: {
        totalBookings: total,
        operator: operator.companyName
      }
    });
  } catch (error) {
    console.error('Error fetching operator bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking analytics for operator
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;
    const { period = '30' } = req.query; // days

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId },
      include: {
        routes: {
          include: {
            bus: {
              select: {
                capacity: true
              }
            }
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(period));

    // Get bookings for the period
    const bookings = await prisma.booking.findMany({
      where: {
        route: {
          operatorId: operator.id
        },
        createdAt: {
          gte: daysAgo
        }
      },
      include: {
        route: {
          include: {
            bus: {
              select: {
                capacity: true
              }
            }
          }
        },
        payment: true
      }
    });

    // Calculate analytics
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;

    const totalRevenue = bookings
      .filter(b => b.status === 'CONFIRMED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // Route performance
    const routePerformance = operator.routes.map(route => {
      const routeBookings = bookings.filter(b => b.routeId === route.id);
      const confirmedCount = routeBookings.filter(b => b.status === 'CONFIRMED').length;
      const revenue = routeBookings
        .filter(b => b.status === 'CONFIRMED')
        .reduce((sum, b) => sum + b.totalAmount, 0);
      
      const occupancyRate = route.bus.capacity > 0 
        ? Math.round((confirmedCount / route.bus.capacity) * 100) 
        : 0;

      return {
        routeId: route.id,
        route: `${route.origin} → ${route.destination}`,
        bookings: routeBookings.length,
        confirmed: confirmedCount,
        revenue,
        occupancyRate,
        price: route.price
      };
    });

    // Daily bookings breakdown
    const dailyBookings = bookings.reduce((acc, booking) => {
      const date = booking.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, confirmed: 0, revenue: 0 };
      }
      acc[date].total++;
      if (booking.status === 'CONFIRMED') {
        acc[date].confirmed++;
        acc[date].revenue += booking.totalAmount;
      }
      return acc;
    }, {} as Record<string, { total: number; confirmed: number; revenue: number }>);

    // Payment method breakdown
    const paymentMethods = bookings
      .filter(b => b.payment && Array.isArray(b.payment) && b.payment.length > 0)
      .reduce((acc, booking) => {
        const method = booking.payment![0].method;
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    res.json({
      period: `${period} days`,
      summary: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        pendingBookings,
        totalRevenue,
        averageBookingValue: totalBookings > 0 ? Math.round(totalRevenue / confirmedBookings) : 0,
        confirmationRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0
      },
      routePerformance,
      dailyBookings,
      paymentMethods,
      operator: {
        id: operator.id,
        name: operator.companyName,
        totalRoutes: operator.routes.length
      }
    });
  } catch (error) {
    console.error('Error fetching operator analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get operator dashboard summary
router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            phone: true,
            email: true
          }
        },
        routes: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                capacity: true
              }
            }
          }
        },
        buses: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await prisma.booking.count({
      where: {
        route: {
          operatorId: operator.id
        },
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        method: 'CASH',
        status: 'PENDING',
        booking: {
          route: {
            operatorId: operator.id
          }
        }
      }
    });

    // Get this month's revenue
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.booking.aggregate({
      where: {
        route: {
          operatorId: operator.id
        },
        status: 'CONFIRMED',
        createdAt: {
          gte: currentMonth
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    // Get upcoming trips (today and tomorrow)
    const upcomingTrips = await prisma.booking.findMany({
      where: {
        route: {
          operatorId: operator.id
        },
        travelDate: {
          gte: today,
          lt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // next 2 days
        },
        status: 'CONFIRMED'
      },
      include: {
        route: {
          include: {
            bus: {
              select: {
                plateNumber: true,
                capacity: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        travelDate: 'asc'
      },
      take: 10
    });

    res.json({
      operator: {
        id: operator.id,
        name: operator.companyName,
        phone: operator.user.phone,
        email: operator.user.email,
        approved: operator.approved,
        totalRoutes: operator.routes.length,
        totalBuses: operator.buses.length
      },
      summary: {
        todayBookings,
        pendingPayments,
        monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
        activeRoutes: operator.routes.filter(r => r.active).length
      },
      upcomingTrips: upcomingTrips.map(booking => ({
        id: booking.id,
        passenger: `${booking.user.firstName} ${booking.user.lastName}`,
        route: {
          origin: booking.route.origin,
          destination: booking.route.destination,
          departureTime: booking.route.departureTime
        },
        bus: {
          plateNumber: booking.route.bus.plateNumber
        },
        seatNumber: booking.seatNumber,
        travelDate: booking.travelDate,
        amount: booking.totalAmount
      })),
      routes: operator.routes.map(route => ({
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        price: route.price,
        active: route.active,
        bus: {
          plateNumber: route.bus.plateNumber,
          capacity: route.bus.capacity
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching operator dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update booking status (for operator management)
router.put('/bookings/:bookingId/status', [
  authenticateToken,
  body('status').isIn(['CONFIRMED', 'CANCELLED']).withMessage('Status must be CONFIRMED or CANCELLED'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bookingId } = req.params;
    const { status, reason } = req.body;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can update booking status' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Get booking with route details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        route: {
          include: {
            operator: true
          }
        },
        user: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify operator owns this booking's route
    if (booking.route.operatorId !== operator.id) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status
      }
    });

    res.json({
      message: `Booking ${status.toLowerCase()} successfully`,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Get operator's own routes
router.get('/routes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId },
      include: {
        routes: {
          include: {
            bus: {
              select: {
                id: true,
                plateNumber: true,
                model: true,
                capacity: true,
                amenities: true
              }
            },
            stops: {
              orderBy: { order: 'asc' }
            },
            operator: {
              select: {
                id: true,
                companyName: true
              }
            }
          },
          orderBy: [
            { origin: 'asc' },
            { destination: 'asc' }
          ]
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    res.json({
      routes: operator.routes,
      total: operator.routes.length
    });
  } catch (error) {
    console.error('Error fetching operator routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get operator's own buses
router.get('/buses', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can access this endpoint' });
    }

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId },
      include: {
        buses: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    res.json(operator.buses);
  } catch (error) {
    console.error('Error fetching operator buses:', error);
    res.status(500).json({ error: 'Failed to fetch buses' });
  }
});

// Create a new route for operator
router.post('/routes', [
  authenticateToken,
  body('origin').isString().notEmpty().withMessage('Origin is required'),
  body('destination').isString().notEmpty().withMessage('Destination is required'),
  body('via').optional().isArray().withMessage('Via must be an array'),
  body('distance').isNumeric().withMessage('Distance must be a number'),
  body('duration').isNumeric().withMessage('Duration must be a number'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('departureTime').isString().notEmpty().withMessage('Departure time is required'),
  body('busId').isString().notEmpty().withMessage('Bus ID is required'),
  body('stops').optional().isArray().withMessage('Stops must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can create routes' });
    }

    const { origin, destination, via, distance, duration, price, departureTime, busId, stops } = req.body;

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    if (!operator.approved) {
      return res.status(403).json({ error: 'Operator must be approved to create routes' });
    }

    // Verify bus belongs to operator
    const bus = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    if (bus.operatorId !== operator.id) {
      return res.status(403).json({ error: 'Bus does not belong to operator' });
    }

    // Create route
    const route = await prisma.route.create({
      data: {
        origin,
        destination,
        via,
        distance,
        duration,
        price,
        departureTime,
        operatorId: operator.id,
        busId,
        active: true
      },
      include: {
        bus: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true
          }
        },
        operator: {
          select: {
            id: true,
            companyName: true
          }
        }
      }
    });

    // Add stops if provided
    if (stops && Array.isArray(stops) && stops.length > 0) {
      await prisma.routeStop.createMany({
        data: stops.map((stop: any, index: number) => ({
          routeId: route.id,
          stopName: stop.stopName,
          distanceFromOrigin: stop.distanceFromOrigin,
          priceFromOrigin: stop.priceFromOrigin,
          estimatedTime: stop.estimatedTime || '00:00',
          order: index
        }))
      });

      // Fetch route with stops
      const routeWithStops = await prisma.route.findUnique({
        where: { id: route.id },
        include: {
          bus: true,
          operator: true,
          stops: {
            orderBy: { order: 'asc' }
          }
        }
      });

      return res.status(201).json({
        route: routeWithStops,
        message: 'Route created successfully'
      });
    }

    res.status(201).json({
      route,
      message: 'Route created successfully'
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// Add a bus for operator
router.post('/buses', [
  authenticateToken,
  body('plateNumber').isString().notEmpty().withMessage('Plate number is required'),
  body('model').isString().notEmpty().withMessage('Model is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Only operators can add buses' });
    }

    const { plateNumber, model, capacity, amenities } = req.body;

    // Find operator by user ID
    const operator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator profile not found' });
    }

    // Check if plate number already exists
    const existingBus = await prisma.bus.findFirst({
      where: { plateNumber }
    });

    if (existingBus) {
      return res.status(400).json({ error: 'Bus with this plate number already exists' });
    }

    // Create bus
    const bus = await prisma.bus.create({
      data: {
        plateNumber,
        model,
        capacity,
        amenities: amenities || [],
        operatorId: operator.id
      }
    });

    res.status(201).json({
      bus,
      message: 'Bus added successfully'
    });
  } catch (error) {
    console.error('Error adding bus:', error);
    res.status(500).json({ error: 'Failed to add bus' });
  }
});

export default router;
