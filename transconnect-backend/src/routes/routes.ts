import { Router, Request, Response } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all routes with optional filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { origin, destination, travelDate } = req.query;

    // Build where clause for filtering
    let whereClause: any = {
      active: true
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
            approved: true
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
        { departureTime: 'asc' }
      ]
    });

    // Calculate availability if travelDate is provided
    const routesWithAvailability = routes.map(route => {
      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        return {
          ...route,
          availability: {
            totalSeats: route.bus.capacity,
            bookedSeats,
            availableSeats,
            isAvailable: availableSeats > 0
          },
          bookings: undefined // Remove bookings from response for privacy
        };
      }
      
      return {
        ...route,
        bookings: undefined // Remove bookings from response
      };
    });

    res.json(routesWithAvailability);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// Get route details by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { travelDate } = req.query;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            approved: true
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
        bookings: travelDate ? {
          where: {
            travelDate: new Date(travelDate as string),
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          select: {
            seatNumber: true,
            status: true
          }
        } : false
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    if (!route.active) {
      return res.status(404).json({ error: 'Route is not active' });
    }

    // Calculate availability if travelDate is provided
    let routeWithAvailability: any = { ...route };
    
    if (travelDate && route.bookings) {
      const bookedSeats = route.bookings.length;
      const availableSeats = route.bus.capacity - bookedSeats;
      
      routeWithAvailability = {
        ...route,
        availability: {
          totalSeats: route.bus.capacity,
          bookedSeats,
          availableSeats,
          isAvailable: availableSeats > 0,
          bookedSeatNumbers: route.bookings.map(b => b.seatNumber)
        },
        bookings: undefined // Remove detailed bookings from response
      };
    } else {
      routeWithAvailability.bookings = undefined;
    }

    res.json(routeWithAvailability);
  } catch (error) {
    console.error('Error fetching route details:', error);
    res.status(500).json({ error: 'Failed to fetch route details' });
  }
});

// Search routes by origin and destination
router.get('/search/:origin/:destination', async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.params;
    const { travelDate } = req.query;

    const routes = await prisma.route.findMany({
      where: {
        active: true,
        origin: {
          contains: origin,
          mode: 'insensitive'
        },
        destination: {
          contains: destination,
          mode: 'insensitive'
        }
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            approved: true
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
        { price: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Filter only approved operators
    const approvedRoutes = routes.filter(route => route.operator.approved);

    // Calculate availability if travelDate is provided
    const routesWithAvailability = approvedRoutes.map(route => {
      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        return {
          ...route,
          availability: {
            totalSeats: route.bus.capacity,
            bookedSeats,
            availableSeats,
            isAvailable: availableSeats > 0
          },
          bookings: undefined
        };
      }
      
      return {
        ...route,
        bookings: undefined
      };
    });

    res.json(routesWithAvailability);
  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({ error: 'Failed to search routes' });
  }
});

// Get unique origins for search suggestions
router.get('/suggestions/origins', async (req: Request, res: Response) => {
  try {
    const origins = await prisma.route.findMany({
      where: { active: true },
      select: { origin: true },
      distinct: ['origin'],
      orderBy: { origin: 'asc' }
    });

    res.json(origins.map(r => r.origin));
  } catch (error) {
    console.error('Error fetching origin suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch origin suggestions' });
  }
});

// Get unique destinations for search suggestions
router.get('/suggestions/destinations', async (req: Request, res: Response) => {
  try {
    const destinations = await prisma.route.findMany({
      where: { active: true },
      select: { destination: true },
      distinct: ['destination'],
      orderBy: { destination: 'asc' }
    });

    res.json(destinations.map(r => r.destination));
  } catch (error) {
    console.error('Error fetching destination suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch destination suggestions' });
  }
});

// Create a new route (Admin/Operator only)
router.post('/', async (req: Request, res: Response) => {
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

    // Validate required fields
    if (!origin || !destination || !distance || !duration || !price || !departureTime || !operatorId || !busId) {
      return res.status(400).json({ 
        error: 'All fields are required: origin, destination, distance, duration, price, departureTime, operatorId, busId' 
      });
    }

    // Verify operator exists
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Verify bus exists and belongs to the operator
    const bus = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!bus || bus.operatorId !== operatorId) {
      return res.status(404).json({ error: 'Bus not found or does not belong to operator' });
    }

    // Create route
    const route = await prisma.route.create({
      data: {
        origin,
        destination,
        via: via || null,
        distance: parseFloat(distance),
        duration: parseInt(duration),
        price: parseFloat(price),
        departureTime,
        operatorId,
        busId,
        active: true
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true
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

    res.status(201).json(route);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// Update route (Admin/Operator only)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      origin, 
      destination,
      via, 
      distance, 
      duration, 
      price, 
      departureTime, 
      active 
    } = req.body;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Update route
    const updateData: any = {};
    if (origin !== undefined) updateData.origin = origin;
    if (destination !== undefined) updateData.destination = destination;
    if (via !== undefined) updateData.via = via || null;
    if (distance !== undefined) updateData.distance = parseFloat(distance);
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (departureTime !== undefined) updateData.departureTime = departureTime;
    if (active !== undefined) updateData.active = active;

    const updatedRoute = await prisma.route.update({
      where: { id },
      data: updateData,
      include: {
        operator: {
          select: {
            id: true,
            companyName: true
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

    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

// Delete route (Admin/Operator only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if route exists
    const existingRoute = await prisma.route.findUnique({
      where: { id }
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if there are any bookings for this route
    const bookings = await prisma.booking.findMany({
      where: { 
        routeId: id,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (bookings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete route with active bookings. Deactivate instead.' 
      });
    }

    await prisma.route.delete({
      where: { id }
    });

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;