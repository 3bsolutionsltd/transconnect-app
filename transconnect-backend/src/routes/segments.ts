/**
 * Route Segments Management API
 * Admin endpoints for creating and managing route segments with pricing
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateToken, requireRole } from '../middleware/auth';
import { createRouteSegments } from '../services/routeSegmentService';

const router = Router();

// All segment endpoints require authentication
router.use(authenticateToken);

/**
 * GET /api/segments/route/:routeId
 * Get all segments for a specific route
 */
router.get('/route/:routeId', async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;

    const segments = await prisma.routeSegment.findMany({
      where: { routeId },
      include: {
        priceVariations: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { segmentOrder: 'asc' },
    });

    return res.json({
      success: true,
      count: segments.length,
      segments,
    });
  } catch (error: any) {
    console.error('Get segments error:', error);
    return res.status(500).json({
      error: 'Failed to fetch segments',
      message: error.message,
    });
  }
});

/**
 * POST /api/segments/route/:routeId
 * Create segments for a route from location sequence
 * Body: { locations: [{ name, distanceKm, durationMinutes, price }] }
 */
router.post('/route/:routeId', requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { routeId } = req.params;
    const { locations } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length < 2) {
      return res.status(400).json({
        error: 'At least 2 locations required',
      });
    }

    // Verify route exists and user has permission
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: { operator: true },
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check operator permission
    if (req.user?.role === 'OPERATOR') {
      const operator = await prisma.operator.findFirst({
        where: { userId: req.user.userId },
      });

      if (!operator || operator.id !== route.operatorId) {
        return res.status(403).json({ error: 'Not authorized for this route' });
      }
    }

    // Create segments
    const segments = await createRouteSegments(routeId, locations);

    // Enable segments for this route
    await prisma.route.update({
      where: { id: routeId },
      data: { segmentEnabled: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Segments created successfully',
      count: segments.length,
      segments,
    });
  } catch (error: any) {
    console.error('Create segments error:', error);
    return res.status(500).json({
      error: 'Failed to create segments',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/segments/:segmentId
 * Update a specific segment (price, distance, duration)
 */
router.patch('/:segmentId', requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const { basePrice, distanceKm, durationMinutes } = req.body;

    // Get segment and verify permission
    const segment = await prisma.routeSegment.findUnique({
      where: { id: segmentId },
      include: { route: { include: { operator: true } } },
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Check operator permission
    if (req.user?.role === 'OPERATOR') {
      const operator = await prisma.operator.findFirst({
        where: { userId: req.user.userId },
      });

      if (!operator || operator.id !== segment.route.operatorId) {
        return res.status(403).json({ error: 'Not authorized for this segment' });
      }
    }

    // Update segment
    const updated = await prisma.routeSegment.update({
      where: { id: segmentId },
      data: {
        ...(basePrice !== undefined && { basePrice }),
        ...(distanceKm !== undefined && { distanceKm }),
        ...(durationMinutes !== undefined && { durationMinutes }),
      },
    });

    return res.json({
      success: true,
      message: 'Segment updated successfully',
      segment: updated,
    });
  } catch (error: any) {
    console.error('Update segment error:', error);
    return res.status(500).json({
      error: 'Failed to update segment',
      message: error.message,
    });
  }
});

/**
 * POST /api/segments/:segmentId/price-variation
 * Add date-based price variation (weekend/holiday premium)
 * Body: { variationType, priceAdjustment, adjustmentType, appliesToDates, startDate, endDate }
 */
router.post('/:segmentId/price-variation', requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;
    const {
      variationType,
      priceAdjustment,
      adjustmentType = 'percentage',
      appliesToDates,
      startDate,
      endDate,
    } = req.body;

    if (!variationType || priceAdjustment === undefined) {
      return res.status(400).json({
        error: 'variationType and priceAdjustment are required',
      });
    }

    // Get segment and verify permission
    const segment = await prisma.routeSegment.findUnique({
      where: { id: segmentId },
      include: { route: { include: { operator: true } } },
    });

    if (!segment) {
      return res.status(404).json({ error: 'Segment not found' });
    }

    // Check operator permission
    if (req.user?.role === 'OPERATOR') {
      const operator = await prisma.operator.findFirst({
        where: { userId: req.user.userId },
      });

      if (!operator || operator.id !== segment.route.operatorId) {
        return res.status(403).json({ error: 'Not authorized for this segment' });
      }
    }

    // Create price variation
    const variation = await prisma.segmentPriceVariation.create({
      data: {
        segmentId,
        variationType,
        priceAdjustment,
        adjustmentType,
        appliesToDates: appliesToDates || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        active: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Price variation created successfully',
      variation,
    });
  } catch (error: any) {
    console.error('Create price variation error:', error);
    return res.status(500).json({
      error: 'Failed to create price variation',
      message: error.message,
    });
  }
});

/**
 * PATCH /api/segments/variation/:variationId
 * Update or deactivate a price variation
 */
router.patch('/variation/:variationId', requireRole(['ADMIN', 'OPERATOR']), async (req: Request, res: Response) => {
  try {
    const { variationId } = req.params;
    const updates = req.body;

    // Get variation and verify permission
    const variation = await prisma.segmentPriceVariation.findUnique({
      where: { id: variationId },
      include: {
        segment: {
          include: { route: { include: { operator: true } } },
        },
      },
    });

    if (!variation) {
      return res.status(404).json({ error: 'Price variation not found' });
    }

    // Check operator permission
    if (req.user?.role === 'OPERATOR') {
      const operator = await prisma.operator.findFirst({
        where: { userId: req.user.userId },
      });

      if (!operator || operator.id !== variation.segment.route.operatorId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    // Update variation
    const updated = await prisma.segmentPriceVariation.update({
      where: { id: variationId },
      data: updates,
    });

    return res.json({
      success: true,
      message: 'Price variation updated successfully',
      variation: updated,
    });
  } catch (error: any) {
    console.error('Update price variation error:', error);
    return res.status(500).json({
      error: 'Failed to update price variation',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/segments/:segmentId
 * Delete a segment (admin only)
 */
router.delete('/:segmentId', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { segmentId } = req.params;

    await prisma.routeSegment.delete({
      where: { id: segmentId },
    });

    return res.json({
      success: true,
      message: 'Segment deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete segment error:', error);
    return res.status(500).json({
      error: 'Failed to delete segment',
      message: error.message,
    });
  }
});

export default router;
