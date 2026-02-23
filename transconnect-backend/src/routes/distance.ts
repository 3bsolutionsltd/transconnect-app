import { Request, Response, Router } from 'express';
import { osrmService } from '../services/osrm.service';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * GET /api/distance/calculate
 * Calculate distance and duration between two locations
 */
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const { origin, destination, mode } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Both origin and destination are required',
      });
    }

    if (!osrmService.isEnabled()) {
      return res.status(503).json({
        error: 'OSRM service not available',
        message: 'Distance calculation service is unavailable',
      });
    }

    const result = await osrmService.calculateDistance(
      origin as string,
      destination as string,
      (mode as any) || 'driving'
    );

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to calculate distance',
        message: result.error,
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Distance calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate distance',
      message: error.message,
    });
  }
});

/**
 * POST /api/distance/calculate-batch
 * Calculate distances for multiple origin-destination pairs
 */
router.post('/calculate-batch', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { pairs } = req.body;

    if (!Array.isArray(pairs) || pairs.length === 0) {
      return res.status(400).json({
        error: 'Pairs array is required with at least one origin-destination pair',
      });
    }

    if (!osrmService.isEnabled()) {
      return res.status(503).json({
        error: 'OSRM service not available',
        message: 'Distance calculation service is unavailable',
      });
    }

    const results = await osrmService.calculateDistanceBatch(pairs);

    return res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Batch distance calculation error:', error);
    return res.status(500).json({
      error: 'Failed to calculate distances',
      message: error.message,
    });
  }
});

/**
 * POST /api/distance/update-routes
 * Update existing routes with calculated distances (Admin only)
 */
router.post('/update-routes', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin or operator
    const user = (req as any).user;
    if (!user || (user.role !== 'ADMIN' && user.role !== 'OPERATOR')) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'Only admins and operators can update routes',
      });
    }

    if (!osrmService.isEnabled()) {
      return res.status(503).json({
        error: 'OSRM service not available',
        message: 'Distance calculation service is unavailable',
      });
    }

    // Get all routes without segments
    const routes = await prisma.route.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        origin: true,
        destination: true,
        distance: true,
        duration: true,
      },
    });

    console.log(`Found ${routes.length} routes to update`);

    const results = {
      total: routes.length,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[],
    };

    // Update routes in batches
    for (const route of routes) {
      try {
        const calculation = await osrmService.calculateDistance(
          route.origin,
          route.destination
        );

        if (calculation.success) {
          // Update route with calculated values
          await prisma.route.update({
            where: { id: route.id },
            data: {
              distance: calculation.distanceKm,
              duration: calculation.durationMinutes,
            },
          });

          results.updated++;
          results.details.push({
            routeId: route.id,
            origin: route.origin,
            destination: route.destination,
            oldDistance: route.distance,
            newDistance: calculation.distanceKm,
            oldDuration: route.duration,
            newDuration: calculation.durationMinutes,
            status: 'updated',
          });

          console.log(`✓ Updated route ${route.id}: ${calculation.distanceKm}km, ${calculation.durationMinutes}min`);
        } else {
          results.failed++;
          results.details.push({
            routeId: route.id,
            origin: route.origin,
            destination: route.destination,
            status: 'failed',
            error: calculation.error,
          });

          console.warn(`✗ Failed to calculate for route ${route.id}: ${calculation.error}`);
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        results.failed++;
        results.details.push({
          routeId: route.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return res.json({
      success: true,
      message: `Updated ${results.updated} routes, ${results.failed} failed`,
      results,
    });
  } catch (error: any) {
    console.error('Route update error:', error);
    return res.status(500).json({
      error: 'Failed to update routes',
      message: error.message,
    });
  }
});

/**
 * GET /api/distance/geocode
 * Get coordinates for an address
 */
router.get('/geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;

    if (!address) {
      return res.status(400).json({
        error: 'Address is required',
      });
    }

    if (!osrmService.isEnabled()) {
      return res.status(503).json({
        error: 'OSRM service not available',
      });
    }

    const coordinates = await osrmService.geocode(address as string);

    if (!coordinates) {
      return res.status(404).json({
        error: 'Location not found',
        message: 'Could not geocode the provided address',
      });
    }

    return res.json({
      success: true,
      address: address as string,
      coordinates,
    });
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return res.status(500).json({
      error: 'Failed to geocode address',
      message: error.message,
    });
  }
});

/**
 * GET /api/distance/validate
 * Validate if a location exists
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({
        error: 'Location is required',
      });
    }

    if (!osrmService.isEnabled()) {
      return res.status(503).json({
        error: 'OSRM service not available',
      });
    }

    const isValid = await osrmService.validateLocation(location as string);

    return res.json({
      success: true,
      location: location as string,
      valid: isValid,
    });
  } catch (error: any) {
    console.error('Location validation error:', error);
    return res.status(500).json({
      error: 'Failed to validate location',
      message: error.message,
    });
  }
});

export default router;
