import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all routes with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { origin, destination, travelDate } = req.query;
    console.log('Routes API called with params:', { origin, destination, travelDate });

    // Build where clause for filtering
    let whereClause: any = {
      active: true,
    };

    if (origin) {
      whereClause.origin = {
        contains: origin as string,
        mode: 'insensitive'
      };
    }

    if (destination) {
      whereClause.destination = {
        contains: destination as string,
        mode: 'insensitive'
      };
    }

    const routes = await prisma.route.findMany({
      where: whereClause,
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            approved: true,
            user: {
              select: {
                phone: true,
                email: true
              }
            }
          }
        },
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
        bookings: travelDate ? {
          where: {
            travelDate: new Date(travelDate as string),
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          select: {
            seatNumber: true
          }
        } : false
      },
      orderBy: [
        { origin: 'asc' },
        { destination: 'asc' },
        { price: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Only show routes from approved operators
    const approvedRoutes = routes.filter(route => route.operator.approved);

    // Calculate availability if travelDate is provided
    const routesWithAvailability = approvedRoutes.map(route => {
      let routeData: any = {
        ...route,
        operatorInfo: {
          id: route.operator.id,
          name: route.operator.companyName,
          phone: route.operator.user.phone,
          email: route.operator.user.email
        },
        bookings: undefined // Remove bookings from response for security
      };

      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        routeData.availability = {
          totalSeats: route.bus.capacity,
          bookedSeats,
          availableSeats,
          bookingRate: Math.round((bookedSeats / route.bus.capacity) * 100)
        };
      }

      return routeData;
    });

    res.json({
      routes: routesWithAvailability,
      total: routesWithAvailability.length,
      filters: { origin, destination, travelDate }
    });

  } catch (error: any) {
    console.error('Routes fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch routes',
      message: error.message 
    });
  }
});

// Get single route by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            approved: true,
            user: {
              select: {
                phone: true,
                email: true
              }
            }
          }
        },
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
        bookings: {
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

    if (!route.operator.approved) {
      return res.status(403).json({ error: 'Route operator not approved' });
    }

    // Calculate availability
    const bookedSeats = route.bookings.filter(b => 
      ['PENDING', 'CONFIRMED'].includes(b.status)
    ).length;
    
    const routeWithInfo = {
      ...route,
      operatorInfo: {
        id: route.operator.id,
        name: route.operator.companyName,
        phone: route.operator.user.phone,
        email: route.operator.user.email
      },
      availability: {
        totalSeats: route.bus.capacity,
        bookedSeats,
        availableSeats: route.bus.capacity - bookedSeats,
        bookingRate: Math.round((bookedSeats / route.bus.capacity) * 100)
      },
      bookings: undefined // Remove detailed booking info
    };

    res.json(routeWithInfo);

  } catch (error: any) {
    console.error('Route fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch route',
      message: error.message 
    });
  }
});

// Create new route (requires authentication)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      origin,
      destination,
      via,
      distance,
      duration,
      price,
      departureTime,
      operatorId,
      busId
    } = req.body;

    // Verify operator exists and is approved
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (!operator.approved) {
      return res.status(403).json({ error: 'Operator not approved' });
    }

    // Verify bus exists and belongs to operator
    const bus = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    if (bus.operatorId !== operatorId) {
      return res.status(403).json({ error: 'Bus does not belong to operator' });
    }

    const route = await prisma.route.create({
      data: {
        origin,
        destination,
        via,
        distance,
        duration,
        price,
        departureTime,
        operatorId,
        busId
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                phone: true,
                email: true
              }
            }
          }
        },
        bus: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true
          }
        }
      }
    });

    res.status(201).json({
      route,
      operatorInfo: {
        id: route.operator.id,
        name: route.operator.companyName,
        phone: route.operator.user.phone
      },
      message: `Route created successfully for ${route.operator.companyName}`
    });

  } catch (error: any) {
    console.error('Route creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create route',
      message: error.message 
    });
  }
});

// Update route
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const route = await prisma.route.update({
      where: { id },
      data: updates,
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                phone: true,
                email: true
              }
            }
          }
        },
        bus: true
      }
    });

    res.json({
      route,
      message: 'Route updated successfully'
    });

  } catch (error: any) {
    console.error('Route update error:', error);
    res.status(500).json({ 
      error: 'Failed to update route',
      message: error.message 
    });
  }
});

// Delete route
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.route.delete({
      where: { id }
    });

    res.json({ message: 'Route deleted successfully' });

  } catch (error: any) {
    console.error('Route deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete route',
      message: error.message 
    });
  }
});

export default router;
