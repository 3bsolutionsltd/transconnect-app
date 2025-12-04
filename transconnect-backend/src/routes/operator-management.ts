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

export default router;