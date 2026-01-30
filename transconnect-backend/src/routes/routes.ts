import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { searchRoutesWithSegments } from '../services/routeSegmentService';
import { googleMapsService } from '../services/googleMaps.service';

const router = Router();

// NEW: Segment-based route search (supports stopovers as origin/destination)
router.get('/search-segments', async (req: Request, res: Response) => {
  try {
    const { origin, destination, date } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Origin and destination are required',
      });
    }

    console.log('Segment search:', { origin, destination, date });

    const travelDate = date ? new Date(date as string) : undefined;
    const results = await searchRoutesWithSegments({
      origin: origin as string,
      destination: destination as string,
      date: travelDate,
    });

    return res.json({
      success: true,
      count: results.length,
      results,
      searchParams: { origin, destination, date },
    });
  } catch (error: any) {
    console.error('Segment search error:', error);
    return res.status(500).json({
      error: 'Failed to search routes',
      message: error.message,
    });
  }
});

// Get all routes with optional filtering (legacy endpoint - now uses segment search!)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { origin, destination, travelDate } = req.query;
    console.log('Routes API called with params:', { origin, destination, travelDate });

    // If both origin and destination provided, use segment-based search (supports stopovers!)
    if (origin && destination) {
      console.log('Using segment-based search for stopover support');
      const travelDate_parsed = travelDate ? new Date(travelDate as string) : undefined;
      const results = await searchRoutesWithSegments({
        origin: origin as string,
        destination: destination as string,
        date: travelDate_parsed,
      });

      // Transform to legacy format for backward compatibility
      const transformedRoutes = results.map(result => ({
        id: result.routeId,
        origin: result.pickupLocation,
        destination: result.dropoffLocation,
        price: result.finalPrice,
        distance: result.totalDistance,
        duration: result.totalDuration,
        departureTime: result.departureTime,
        bus: result.busInfo,
        operator: result.operatorInfo,
        segments: result.segments, // Include segment details
        active: true,
        segmentEnabled: true
      }));

      console.log('Transformed routes:', transformedRoutes.map(r => ({ id: r.id, origin: r.origin, destination: r.destination })));
      return res.json(transformedRoutes);
    }

    // Otherwise, use legacy query for listing all routes
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
        // Ensure all time fields are properly formatted as strings
        departureTime: route.departureTime ? String(route.departureTime) : route.departureTime,
        createdAt: route.createdAt ? route.createdAt.toISOString() : null,
        updatedAt: route.updatedAt ? route.updatedAt.toISOString() : null,
        stops: route.stops.map((stop: any) => ({
          ...stop,
          estimatedTime: stop.estimatedTime ? String(stop.estimatedTime) : stop.estimatedTime,
          createdAt: stop.createdAt ? stop.createdAt.toISOString() : null,
          updatedAt: stop.updatedAt ? stop.updatedAt.toISOString() : null,
        })),
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
      // Ensure all time fields are properly formatted as strings
      departureTime: route.departureTime ? String(route.departureTime) : route.departureTime,
      createdAt: route.createdAt ? route.createdAt.toISOString() : null,
      updatedAt: route.updatedAt ? route.updatedAt.toISOString() : null,
      stops: route.stops.map(stop => ({
        ...stop,
        estimatedTime: stop.estimatedTime ? String(stop.estimatedTime) : stop.estimatedTime,
        createdAt: stop.createdAt ? stop.createdAt.toISOString() : null,
        updatedAt: stop.updatedAt ? stop.updatedAt.toISOString() : null,
      })),
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

    // Convert via array to string if needed
    const viaString = Array.isArray(via) ? via.join(', ') : (via || null);

    // Auto-calculate distance and duration if not provided and Google Maps is enabled
    let finalDistance = distance;
    let finalDuration = duration;

    if ((!distance || !duration) && googleMapsService.isEnabled()) {
      console.log(`Auto-calculating distance for ${origin} → ${destination}`);
      const calculation = await googleMapsService.calculateDistance(origin, destination);
      
      if (calculation.success) {
        finalDistance = finalDistance || calculation.distanceKm;
        finalDuration = finalDuration || calculation.durationMinutes;
        console.log(`✓ Calculated: ${finalDistance}km, ${finalDuration}min`);
      } else {
        console.warn(`⚠ Distance calculation failed: ${calculation.error}`);
        // If no distance/duration provided and calculation failed, return error
        if (!distance || !duration) {
          return res.status(400).json({
            error: 'Distance and duration are required (auto-calculation failed)',
            calculationError: calculation.error,
          });
        }
      }
    }

    const route = await prisma.route.create({
      data: {
        origin,
        destination,
        via: viaString,
        distance: finalDistance,
        duration: finalDuration,
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

    // Convert via array to string if needed
    if (updates.via && Array.isArray(updates.via)) {
      updates.via = updates.via.join(', ');
    }

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
      price
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

    // Return all stops except the last one (can't board at final destination)
    const boardingStops = route.stops.slice(0, -1);

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

// ============================================================================
// ROUTE SEGMENT MANAGEMENT ENDPOINTS
// ============================================================================

// Get segments for a specific route
router.get('/:routeId/segments', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;

    const segments = await prisma.routeSegment.findMany({
      where: { routeId },
      include: {
        priceVariations: {
          where: { active: true },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { segmentOrder: 'asc' }
    });

    res.json({
      success: true,
      count: segments.length,
      segments
    });
  } catch (error: any) {
    console.error('Error fetching route segments:', error);
    res.status(500).json({
      error: 'Failed to fetch route segments',
      message: error.message
    });
  }
});

// Create segments for a route
router.post('/:routeId/segments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const { segments } = req.body;

    // Validate route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: { operator: true }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Authorization check: Only ADMIN or route operator can add segments
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      // Check if user is the operator for this route
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can manage segments' 
        });
      }
    }

    // Validate segments array
    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ 
        error: 'Segments array is required and must not be empty' 
      });
    }

    // Create segments in transaction
    const createdSegments = await prisma.$transaction(
      segments.map((seg: any, index: number) => 
        prisma.routeSegment.create({
          data: {
            routeId,
            segmentOrder: seg.segmentOrder || index + 1,
            fromLocation: seg.fromLocation,
            toLocation: seg.toLocation,
            distanceKm: seg.distanceKm,
            durationMinutes: seg.durationMinutes,
            basePrice: seg.basePrice
          }
        })
      )
    );

    // Update route to enable segments
    await prisma.route.update({
      where: { id: routeId },
      data: { segmentEnabled: true }
    });

    res.status(201).json({
      success: true,
      message: `Created ${createdSegments.length} segments`,
      segments: createdSegments
    });
  } catch (error: any) {
    console.error('Error creating route segments:', error);
    res.status(500).json({
      error: 'Failed to create route segments',
      message: error.message
    });
  }
});

// Update a specific segment
router.put('/segments/:segmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const { fromLocation, toLocation, distanceKm, durationMinutes, basePrice } = req.body;

    // Get segment and route for authorization
    const segment = await prisma.routeSegment.findUnique({
      where: { id: segmentId },
      include: {
        route: {
          include: { operator: true }
        }
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Authorization check
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: segment.route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can update segments' 
        });
      }
    }

    // Update segment
    const updatedSegment = await prisma.routeSegment.update({
      where: { id: segmentId },
      data: {
        ...(fromLocation && { fromLocation }),
        ...(toLocation && { toLocation }),
        ...(distanceKm && { distanceKm }),
        ...(durationMinutes && { durationMinutes }),
        ...(basePrice && { basePrice })
      }
    });

    res.json({
      success: true,
      message: 'Segment updated successfully',
      segment: updatedSegment
    });
  } catch (error: any) {
    console.error('Error updating segment:', error);
    res.status(500).json({
      error: 'Failed to update segment',
      message: error.message
    });
  }
});

// Delete a segment
router.delete('/segments/:segmentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;

    // Get segment and route for authorization
    const segment = await prisma.routeSegment.findUnique({
      where: { id: segmentId },
      include: {
        route: {
          include: { operator: true }
        }
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Authorization check
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: segment.route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can delete segments' 
        });
      }
    }

    await prisma.routeSegment.delete({
      where: { id: segmentId }
    });

    res.json({
      success: true,
      message: 'Segment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting segment:', error);
    res.status(500).json({
      error: 'Failed to delete segment',
      message: error.message
    });
  }
});

// ============================================================================
// PRICE VARIATION MANAGEMENT ENDPOINTS
// ============================================================================

// Get price variations for a segment
router.get('/segments/:segmentId/variations', async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;

    const variations = await prisma.segmentPriceVariation.findMany({
      where: { segmentId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: variations.length,
      variations
    });
  } catch (error: any) {
    console.error('Error fetching price variations:', error);
    res.status(500).json({
      error: 'Failed to fetch price variations',
      message: error.message
    });
  }
});

// Create a price variation
router.post('/segments/:segmentId/variations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const { 
      variationType, 
      priceAdjustment, 
      adjustmentType, 
      appliesToDates, 
      startDate, 
      endDate 
    } = req.body;

    // Get segment and route for authorization
    const segment = await prisma.routeSegment.findUnique({
      where: { id: segmentId },
      include: {
        route: {
          include: { operator: true }
        }
      }
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Authorization check
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: segment.route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can create price variations' 
        });
      }
    }

    // Validate variation type
    const validTypes = ['weekend', 'holiday', 'peak_season', 'custom'];
    if (!validTypes.includes(variationType)) {
      return res.status(400).json({ 
        error: `Invalid variation type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Validate adjustment type
    const validAdjustmentTypes = ['percentage', 'fixed'];
    if (!validAdjustmentTypes.includes(adjustmentType)) {
      return res.status(400).json({ 
        error: `Invalid adjustment type. Must be one of: ${validAdjustmentTypes.join(', ')}` 
      });
    }

    const variation = await prisma.segmentPriceVariation.create({
      data: {
        segmentId,
        variationType,
        priceAdjustment,
        adjustmentType: adjustmentType || 'percentage',
        appliesToDates,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Price variation created successfully',
      variation
    });
  } catch (error: any) {
    console.error('Error creating price variation:', error);
    res.status(500).json({
      error: 'Failed to create price variation',
      message: error.message
    });
  }
});

// Update a price variation
router.put('/variations/:variationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { variationId } = req.params;
    const updates = req.body;

    // Get variation, segment, and route for authorization
    const variation = await prisma.segmentPriceVariation.findUnique({
      where: { id: variationId },
      include: {
        segment: {
          include: {
            route: {
              include: { operator: true }
            }
          }
        }
      }
    });

    if (!variation) {
      return res.status(404).json({ error: 'Price variation not found' });
    }

    // Authorization check
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: variation.segment.route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can update price variations' 
        });
      }
    }

    // Process date updates
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const updatedVariation = await prisma.segmentPriceVariation.update({
      where: { id: variationId },
      data: updates
    });

    res.json({
      success: true,
      message: 'Price variation updated successfully',
      variation: updatedVariation
    });
  } catch (error: any) {
    console.error('Error updating price variation:', error);
    res.status(500).json({
      error: 'Failed to update price variation',
      message: error.message
    });
  }
});

// Delete a price variation
router.delete('/variations/:variationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { variationId } = req.params;

    // Get variation, segment, and route for authorization
    const variation = await prisma.segmentPriceVariation.findUnique({
      where: { id: variationId },
      include: {
        segment: {
          include: {
            route: {
              include: { operator: true }
            }
          }
        }
      }
    });

    if (!variation) {
      return res.status(404).json({ error: 'Price variation not found' });
    }

    // Authorization check
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: variation.segment.route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can delete price variations' 
        });
      }
    }

    await prisma.segmentPriceVariation.delete({
      where: { id: variationId }
    });

    res.json({
      success: true,
      message: 'Price variation deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting price variation:', error);
    res.status(500).json({
      error: 'Failed to delete price variation',
      message: error.message
    });
  }
});

// Toggle price variation active status
router.patch('/variations/:variationId/toggle', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { variationId } = req.params;

    // Get variation, segment, and route for authorization
    const variation = await prisma.segmentPriceVariation.findUnique({
      where: { id: variationId },
      include: {
        segment: {
          include: {
            route: {
              include: { operator: true }
            }
          }
        }
      }
    });

    if (!variation) {
      return res.status(404).json({ error: 'Price variation not found' });
    }

    // Authorization check
    const userRole = (req as any).user.role;
    const userId = (req as any).user.userId;

    if (userRole !== 'ADMIN') {
      const operator = await prisma.operator.findFirst({
        where: {
          userId: userId,
          id: variation.segment.route.operatorId
        }
      });

      if (!operator) {
        return res.status(403).json({ 
          error: 'Unauthorized - Only route operator or admin can toggle price variations' 
        });
      }
    }

    const updatedVariation = await prisma.segmentPriceVariation.update({
      where: { id: variationId },
      data: { active: !variation.active }
    });

    res.json({
      success: true,
      message: `Price variation ${updatedVariation.active ? 'activated' : 'deactivated'} successfully`,
      variation: updatedVariation
    });
  } catch (error: any) {
    console.error('Error toggling price variation:', error);
    res.status(500).json({
      error: 'Failed to toggle price variation',
      message: error.message
    });
  }
});

export default router;
