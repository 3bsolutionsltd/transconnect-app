import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireFeature, isFeatureEnabled } from '../utils/feature-flags';

const router = Router();

/**
 * PUBLIC ENDPOINTS - No authentication required
 * These endpoints allow passengers to view operator portals
 */

// GET /api/operator-portal/slug/:slug - Get operator by slug with routes and buses
router.get('/slug/:slug', requireFeature('OPERATOR_PORTAL'), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Find operator by slug
    const operator = await prisma.operator.findUnique({
      where: { 
        slug: slug.toLowerCase() 
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        buses: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        routes: {
          where: {
            active: true
          },
          select: {
            id: true,
            origin: true,
            destination: true,
            price: true,
            departureTime: true,
            arrivalTime: true,
            active: true,
            busId: true,
            bus: {
              select: {
                plateNumber: true,
                model: true,
                capacity: true
              }
            }
          },
          orderBy: {
            departureTime: 'asc'
          }
        }
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Check if portal is enabled
    if (!operator.portalEnabled) {
      return res.status(404).json({ error: 'Operator portal is not available' });
    }

    // Return operator data
    res.json({
      success: true,
      operator: {
        id: operator.id,
        companyName: operator.companyName,
        slug: operator.slug,
        brandLogoUrl: operator.brandLogoUrl,
        brandColor: operator.brandColor,
        tagline: operator.tagline,
        description: operator.description,
        contact: {
          name: `${operator.user.firstName} ${operator.user.lastName}`,
          email: operator.user.email,
          phone: operator.user.phone
        },
        buses: operator.buses,
        routes: operator.routes,
        stats: {
          totalBuses: operator.buses.length,
          activeRoutes: operator.routes.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching operator by slug:', error);
    res.status(500).json({ error: 'Failed to fetch operator portal' });
  }
});

// GET /api/operator-portal/:operatorId/routes - Get all active routes for an operator
router.get('/:operatorId/routes', requireFeature('OPERATOR_PORTAL'), async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.params;
    const { origin, destination, date } = req.query;

    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    // Verify operator exists and portal is enabled
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { 
        id: true, 
        companyName: true,
        portalEnabled: true 
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (!operator.portalEnabled) {
      return res.status(404).json({ error: 'Operator portal is not available' });
    }

    // Build where clause
    const whereClause: any = {
      operatorId,
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

    // Fetch routes
    const routes = await prisma.route.findMany({
      where: whereClause,
      include: {
        bus: {
          select: {
            plateNumber: true,
            model: true,
            capacity: true
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      }
    });

    res.json({
      success: true,
      operator: {
        id: operator.id,
        companyName: operator.companyName
      },
      count: routes.length,
      routes
    });
  } catch (error) {
    console.error('Error fetching operator routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

// GET /api/operator-portal/:operatorId/stats - Get public statistics
router.get('/:operatorId/stats', requireFeature('OPERATOR_PORTAL'), async (req: Request, res: Response) => {
  try {
    const { operatorId } = req.params;

    if (!operatorId) {
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    // Verify operator exists and portal is enabled
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { 
        id: true, 
        companyName: true,
        portalEnabled: true,
        createdAt: true
      }
    });

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    if (!operator.portalEnabled) {
      return res.status(404).json({ error: 'Operator portal is not available' });
    }

    // Get statistics
    const [busCount, activeRouteCount, totalBookings] = await Promise.all([
      prisma.bus.count({
        where: { operatorId }
      }),
      prisma.route.count({
        where: { 
          operatorId,
          active: true 
        }
      }),
      prisma.booking.count({
        where: {
          route: {
            operatorId
          },
          status: 'CONFIRMED'
        }
      })
    ]);

    // Calculate years in operation
    const yearsInOperation = Math.floor(
      (Date.now() - operator.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    res.json({
      success: true,
      operator: {
        id: operator.id,
        companyName: operator.companyName
      },
      stats: {
        totalBuses: busCount,
        activeRoutes: activeRouteCount,
        totalTripsCompleted: totalBookings,
        yearsInOperation: yearsInOperation > 0 ? yearsInOperation : '< 1'
      }
    });
  } catch (error) {
    console.error('Error fetching operator stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * FEATURE FLAG CHECK - Check if operator portal features are enabled
 */
router.get('/feature/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    features: {
      operatorPortal: isFeatureEnabled('OPERATOR_PORTAL'),
      portalConfig: isFeatureEnabled('OPERATOR_PORTAL_CONFIG'),
      analytics: isFeatureEnabled('OPERATOR_PORTAL_ANALYTICS'),
      customDomains: isFeatureEnabled('OPERATOR_PORTAL_CUSTOM_DOMAINS')
    }
  });
});

export default router;
