import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { requireOperatorAccess, requireOperatorPermission } from '../middleware/operator-permissions';

const router = Router();

// Smart grouping function for similar routes
function groupRoutesByDestination(routes: any[]) {
  const grouped: { [key: string]: any } = {};
  
  routes.forEach(route => {
    const routeKey = `${route.origin}-${route.destination}`;
    
    if (!grouped[routeKey]) {
      grouped[routeKey] = {
        routeName: `${route.origin} → ${route.destination}`,
        origin: route.origin,
        destination: route.destination,
        operators: [],
        priceRange: { min: route.price, max: route.price },
        totalOptions: 0
      };
    }
    
    // Add operator if not already present
    const existingOperator = grouped[routeKey].operators.find(
      (op: any) => op.operatorId === route.operator.id
    );
    
    if (!existingOperator) {
      grouped[routeKey].operators.push({
        operatorId: route.operator.id,
        operatorName: route.operator.companyName,
        routes: [route],
        minPrice: route.price,
        availableSeats: route.availability?.availableSeats || route.bus.capacity
      });
    } else {
      existingOperator.routes.push(route);
      existingOperator.minPrice = Math.min(existingOperator.minPrice, route.price);
      if (route.availability) {
        existingOperator.availableSeats += route.availability.availableSeats;
      }
    }
    
    // Update price range
    grouped[routeKey].priceRange.min = Math.min(grouped[routeKey].priceRange.min, route.price);
    grouped[routeKey].priceRange.max = Math.max(grouped[routeKey].priceRange.max, route.price);
    grouped[routeKey].totalOptions++;
  });
  
  return grouped;
}

// Get all routes with optional filtering - Enhanced with operator information
router.get('/', async (req: Request, res: Response) => {
  try {
    const { origin, destination, travelDate, groupByRoute } = req.query;
    console.log('Routes API called with params:', { origin, destination, travelDate, groupByRoute });

    // Build where clause for filtering
    let whereClause: any = {
      active: true,
      operator: {
        approved: true // Only show routes from approved operators
      }
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
            phone: true,
            email: true
          }
        },s: {
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
        { price: 'asc' }, // Show cheapest first
        { departureTime: 'asc' }
      ]
    });

    // Calculate availability if travelDate is provided
    const routesWithAvailability = routes.map(route => {
      let routeData: any = {
        ...route,
        // Enhanced operator display information
        operatorInfo: {
          id: route.operator.id,
          name: route.operator.companyName,
          phone: route.operator.phone,
          email: route.operator.email
        },
        bookings: undefined // Remove bookings from response for privacy
      };

      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        routeData.availability = {
          totalSeats: route.bus.capacity,
          bookedSeats,
          availableSeats,
          isAvailable: availableSeats > 0
        };
      }
      
      return routeData;
    });

    // Smart grouping for similar routes (if requested)
    if (groupByRoute === 'true') {
      const groupedRoutes = groupRoutesByDestination(routesWithAvailability);
      console.log('Grouped routes found:', Object.keys(groupedRoutes).length);
      return res.json({ 
        routes: routesWithAvailability,
        grouped: groupedRoutes 
      });
    }

    console.log('Routes found:', routesWithAvailability.length);
    console.log('Sample route:', routesWithAvailability[0] ? {
      id: routesWithAvailability[0].id,
      origin: routesWithAvailability[0].origin,
      destination: routesWithAvailability[0].destination,
      operator: routesWithAvailability[0].operatorInfo.name
    } : 'None');

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
        stops: {
          orderBy: { order: 'asc' }
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

// Smart search routes - Groups similar routes by different operators
router.get('/smart-search/:origin/:destination', async (req: Request, res: Response) => {
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
        },
        operator: {
          approved: true
        }
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            phone: true,
            email: true,
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
        { price: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Process routes with availability
    const routesWithAvailability = routes.map(route => {
      let routeData: any = {
        ...route,
        operatorInfo: {
          id: route.operator.id,
          name: route.operator.companyName,
          
          phone: route.operator.phone,
          email: route.operator.email
        },
        bookings: undefined
      };

      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        routeData.availability = {
          totalSeats: route.bus.capacity,
          bookedSeats,
          availableSeats,
          isAvailable: availableSeats > 0
        };
      }
      
      return routeData;
    });

    // Group routes smartly
    const grouped = groupRoutesByDestination(routesWithAvailability);
    
    res.json({
      routeInfo: {
        origin,
        destination,
        totalOperators: Object.keys(grouped).length > 0 ? grouped[`${origin}-${destination}`]?.operators?.length || 0 : 0,
        totalRoutes: routesWithAvailability.length,
        searchDate: travelDate
      },
      routes: routesWithAvailability,
      groupedByOperator: grouped
    });
  } catch (error) {
    console.error('Error in smart route search:', error);
    res.status(500).json({ error: 'Failed to search routes' });
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
        },
        operator: {
          approved: true
        }
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,

            phone: true,
            email: true,
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
        { price: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Filter only approved operators
    const approvedRoutes = routes.filter(route => route.operator.approved);

    // Calculate availability if travelDate is provided
    const routesWithAvailability = approvedRoutes.map(route => {
      let routeData: any = {
        ...route,
        operatorInfo: {
          id: route.operator.id,
          name: route.operator.companyName,
          
          phone: route.operator.phone,
          email: route.operator.email
        },
        bookings: undefined
      };

      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        routeData.availability = {
          totalSeats: route.bus.capacity,
          bookedSeats,
          availableSeats,
          isAvailable: availableSeats > 0
        };
      }
      
      return routeData;
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

// Get routes for specific operator (Operator users only see their company's routes)
router.get('/my-routes', authenticateToken, requireOperatorAccess, async (req: Request, res: Response) => {
  try {
    const operatorId = (req as any).operatorId;
    const operatorRole = (req as any).operatorRole;
    const operatorCompany = (req as any).operatorCompany;
    const { travelDate } = req.query;

    const routes = await prisma.route.findMany({
      where: {
        operatorId,
        active: true
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,

            phone: true
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
            seatNumber: true,
            status: true
          }
        } : false
      },
      orderBy: [
        { origin: 'asc' },
        { destination: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    // Calculate availability and add operator context
    const routesWithContext = routes.map(route => {
      let routeData: any = {
        ...route,
        operatorInfo: {
          id: route.operator.id,
          name: route.operator.companyName,
          
          phone: route.operator.phone
        },
        canEdit: ['OWNER', 'MANAGER', 'TICKETER'].includes(operatorRole || ''),
        canDelete: ['OWNER', 'MANAGER'].includes(operatorRole || ''),
        bookings: undefined
      };

      if (travelDate && route.bookings) {
        const bookedSeats = route.bookings.length;
        const availableSeats = route.bus.capacity - bookedSeats;
        
        routeData.availability = {
          totalSeats: route.bus.capacity,
          bookedSeats,
          availableSeats,
          isAvailable: availableSeats > 0
        };
      }
      
      return routeData;
    });

    res.json({
      companyInfo: {
        operatorId,
        companyName: operatorCompany,
        userRole: operatorRole,
        totalRoutes: routes.length
      },
      routes: routesWithContext
    });
  } catch (error) {
    console.error('Error fetching operator routes:', error);
    res.status(500).json({ error: 'Failed to fetch operator routes' });
  }
});

// Create a new route (Admin/Operator only)

// Create a new route - Enhanced for operator users (Auto-determine operator)
router.post('/', authenticateToken, requireOperatorAccess, requireOperatorPermission(['create_route']), async (req: Request, res: Response) => {
  try {
    const { 
      origin, 
      destination,
      via, 
      distance, 
      duration, 
      price, 
      departureTime, 
      busId 
    } = req.body;

    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;
    const operatorId = (req as any).operatorId; // Auto-determined by middleware
    const operatorRole = (req as any).operatorRole;
    const operatorCompany = (req as any).operatorCompany;

    // Validate required fields
    if (!origin || !destination || !distance || !duration || !price || !departureTime || !busId) {
      return res.status(400).json({ 
        error: 'All fields are required: origin, destination, distance, duration, price, departureTime, busId' 
      });
    }

    // For admins, they can specify operatorId in the request body
    let finalOperatorId = operatorId;
    if (userRole === 'ADMIN' && req.body.operatorId) {
      finalOperatorId = req.body.operatorId;
      
      // Verify the specified operator exists
      const specifiedOperator = await prisma.operator.findUnique({
        where: { id: finalOperatorId }
      });
      
      if (!specifiedOperator) {
        return res.status(404).json({ error: 'Specified operator not found' });
      }
    }

    // Verify bus exists and belongs to the operator
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        operator: {
          select: { id: true, companyName: true }
        }
      }
    });

    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }

    if (bus.operatorId !== finalOperatorId) {
      return res.status(400).json({ 
        error: `Bus belongs to ${bus.operator.companyName}, not ${operatorCompany || 'your company'}` 
      });
    }

    // Create route with auto-determined operator
    const route = await prisma.route.create({
      data: {
        origin: origin.trim(),
        destination: destination.trim(),
        via: via?.trim() || null,
        distance: parseFloat(distance),
        duration: parseInt(duration),
        price: parseFloat(price),
        departureTime,
        operatorId: finalOperatorId,
        busId,
        active: true
      },
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,

            phone: true
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
        }
      }
    });

    console.log(`Route created by ${operatorRole || 'operator'} user for ${operatorCompany}:`, {
      id: route.id,
      route: `${route.origin} → ${route.destination}`,
      operator: route.operator.companyName,
      createdBy: operatorRole || userRole
    });

    res.status(201).json({
      ...route,
      // Enhanced response with operator info
      operatorInfo: {
        id: route.operator.id,
        name: route.operator.companyName,
        
        phone: route.operator.phone
      },
      createdByRole: operatorRole || userRole,
      message: `Route created successfully for ${route.operator.companyName}`
    });
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

// ==================== ROUTE STOPS MANAGEMENT ====================

// Get stops for a specific route
router.get('/:id/stops', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json(route.stops);
  } catch (error) {
    console.error('Error fetching route stops:', error);
    res.status(500).json({ error: 'Failed to fetch route stops' });
  }
});

// Add stops to a route (Admin/Operator only)
router.post('/:id/stops', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stops } = req.body;

    // Validate request
    if (!stops || !Array.isArray(stops)) {
      return res.status(400).json({ error: 'Stops array is required' });
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Delete existing stops for the route
    await prisma.routeStop.deleteMany({
      where: { routeId: id }
    });

    // Create new stops
    const createdStops = await prisma.$transaction(
      stops.map((stop: any, index: number) => 
        prisma.routeStop.create({
          data: {
            routeId: id,
            stopName: stop.stopName,
            distanceFromOrigin: parseFloat(stop.distanceFromOrigin),
            priceFromOrigin: parseFloat(stop.priceFromOrigin),
            order: index + 1,
            estimatedTime: stop.estimatedTime
          }
        })
      )
    );

    res.status(201).json(createdStops);
  } catch (error) {
    console.error('Error adding route stops:', error);
    res.status(500).json({ error: 'Failed to add route stops' });
  }
});

// Calculate price between two stops
router.get('/:id/stops/calculate-price', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { boardingStop, alightingStop } = req.query;

    if (!boardingStop || !alightingStop) {
      return res.status(400).json({ 
        error: 'boardingStop and alightingStop parameters are required' 
      });
    }

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const boarding = route.stops.find(stop => stop.stopName === boardingStop);
    const alighting = route.stops.find(stop => stop.stopName === alightingStop);

    if (!boarding || !alighting) {
      return res.status(400).json({ error: 'Invalid boarding or alighting stop' });
    }

    if (boarding.order >= alighting.order) {
      return res.status(400).json({ error: 'Boarding stop must be before alighting stop' });
    }

    const distance = alighting.distanceFromOrigin - boarding.distanceFromOrigin;
    const price = alighting.priceFromOrigin - boarding.priceFromOrigin;

    res.json({
      boardingStop: boarding,
      alightingStop: alighting,
      distance,
      price,
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination
      }
    });
  } catch (error) {
    console.error('Error calculating stop price:', error);
    res.status(500).json({ error: 'Failed to calculate stop price' });
  }
});

// Get all available boarding stops (for passenger selection)
router.get('/:id/boarding-stops', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[DEBUG] Fetching boarding stops for route: ${id}`);

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log(`[DEBUG] Route found:`, !!route);
    console.log(`[DEBUG] Route stops count:`, route?.stops?.length || 0);
    
    if (route?.stops) {
      console.log(`[DEBUG] Route stops:`, route.stops.map(s => s.stopName));
    }

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Return all stops except the last one (can't board at final destination)
    const boardingStops = route.stops.slice(0, -1);
    console.log(`[DEBUG] Boarding stops count:`, boardingStops.length);

    res.json(boardingStops);
  } catch (error) {
    console.error('Error fetching boarding stops:', error);
    res.status(500).json({ error: 'Failed to fetch boarding stops' });
  }
});

// Get available alighting stops for a given boarding stop
router.get('/:id/alighting-stops/:boardingStop', async (req: Request, res: Response) => {
  try {
    const { id, boardingStop } = req.params;

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const boardingStopData = route.stops.find(stop => 
      stop.stopName === decodeURIComponent(boardingStop)
    );

    if (!boardingStopData) {
      return res.status(400).json({ error: 'Invalid boarding stop' });
    }

    // Return all stops after the boarding stop
    const alightingStops = route.stops.filter(stop => 
      stop.order > boardingStopData.order
    );

    res.json(alightingStops);
  } catch (error) {
    console.error('Error fetching alighting stops:', error);
    res.status(500).json({ error: 'Failed to fetch alighting stops' });
  }
});

export default router;
