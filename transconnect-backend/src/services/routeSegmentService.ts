/**
 * Route Segment Service
 * Handles segment-based route searching and pricing calculations
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteSearchParams {
  origin: string;
  destination: string;
  date?: Date;
}

interface SegmentPriceCalculation {
  segmentId: string;
  basePrice: number;
  adjustments: {
    type: string;
    amount: number;
    reason: string;
  }[];
  finalPrice: number;
}

interface RouteSearchResult {
  routeId: string;
  origin: string;
  destination: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalDistance: number;
  totalDuration: number;
  basePrice: number;
  finalPrice: number;
  segments: SegmentPriceCalculation[];
  departureTime: string;
  busInfo: {
    plateNumber: string;
    model: string;
    capacity: number;
  };
  operatorInfo: {
    companyName: string;
  };
}

/**
 * Search for routes with stopover support
 * Origin and destination can be main endpoints or stopovers
 */
export async function searchRoutesWithSegments(
  params: RouteSearchParams
): Promise<RouteSearchResult[]> {
  const { origin, destination, date } = params;

  console.log(`Segment search called: ${origin} → ${destination}`);

  await materializeLegacyViaRoutes();

  // SQL query to find all routes where origin and destination match any segment
  // Note: Using camelCase for columns as per Prisma schema
  const query = Prisma.sql`
    WITH route_connections AS (
      SELECT DISTINCT 
        r.id as route_id,
        r.origin,
        r.destination,
        r."departureTime",
        r."operatorId",
        r."busId",
        rs1.from_location as pickup,
        rs2.to_location as dropoff,
        rs1.segment_order as start_order,
        rs2.segment_order as end_order
      FROM routes r
      JOIN route_segments rs1 ON rs1.route_id = r.id
      JOIN route_segments rs2 ON rs2.route_id = r.id
      WHERE r.active = true
        AND r.segment_enabled = true
        AND rs1.from_location ILIKE ${`%${origin}%`}
        AND rs2.to_location ILIKE ${`%${destination}%`}
        AND rs1.segment_order <= rs2.segment_order
    )
    SELECT * FROM route_connections
    ORDER BY route_id;
  `;

  const rawResults = await prisma.$queryRaw<any[]>(query);

  console.log(`Found ${rawResults.length} route connections`);

  // Process each matching route
  const results: RouteSearchResult[] = [];

  for (const raw of rawResults) {
    try {
      // Get route details
      const route = await prisma.route.findUnique({
        where: { id: raw.route_id },
        include: {
          bus: true,
          operator: true,
        },
      });

      if (!route) continue;

      // Get segments for this journey
      const segments = await prisma.routeSegment.findMany({
        where: {
          routeId: raw.route_id,
          segmentOrder: {
            gte: raw.start_order,
            lte: raw.end_order,
          },
        },
        include: {
          priceVariations: {
            where: { active: true },
          },
        },
        orderBy: { segmentOrder: 'asc' },
      });

      // Calculate pricing for each segment
      const segmentPrices = await Promise.all(
        segments.map((seg) => calculateSegmentPrice(seg, date))
      );

      // Aggregate totals
      const totalDistance = segments.reduce(
        (sum, seg) => sum + (Number(seg.distanceKm) || 0),
        0
      );
      const totalDuration = segments.reduce(
        (sum, seg) => sum + (seg.durationMinutes || 0),
        0
      );
      const basePrice = segments.reduce(
        (sum, seg) => sum + Number(seg.basePrice),
        0
      );
      const finalPrice = segmentPrices.reduce(
        (sum, calc) => sum + calc.finalPrice,
        0
      );

      results.push({
        routeId: route.id,
        origin: route.origin,
        destination: route.destination,
        pickupLocation: raw.pickup,
        dropoffLocation: raw.dropoff,
        totalDistance,
        totalDuration,
        basePrice,
        finalPrice: Math.round(finalPrice), // Round to nearest UGX
        segments: segmentPrices,
        departureTime: route.departureTime,
        busInfo: {
          plateNumber: route.bus.plateNumber,
          model: route.bus.model,
          capacity: route.bus.capacity,
        },
        operatorInfo: {
          companyName: route.operator.companyName,
        },
      });
    } catch (error) {
      console.error(`Error processing route ${raw.route_id}:`, error);
    }
  }

  // Sort by final price
  return results.sort((a, b) => a.finalPrice - b.finalPrice);
}

/**
 * Convert routes that still only have the legacy comma-separated `via` value
 * into the stop and segment records used by search and booking.
 *
 * The generated values are a migration baseline. Operators can replace the
 * segment prices with their actual fares through the segment management API.
 */
export async function materializeLegacyViaRoutes(): Promise<void> {
  const routes = await prisma.route.findMany({
    where: {
      active: true,
      via: { not: null },
      segments: { none: {} },
    },
    select: {
      id: true,
      origin: true,
      destination: true,
      via: true,
      distance: true,
      duration: true,
      price: true,
      departureTime: true,
    },
  });

  for (const route of routes) {
    const viaLocations = (route.via || '')
      .split(',')
      .map((location) => location.trim())
      .filter(Boolean);
    const locations = [route.origin, ...viaLocations, route.destination]
      .filter((location, index, all) => all.indexOf(location) === index);

    if (locations.length < 2) continue;

    const segmentCount = locations.length - 1;
    const stops = locations.map((stopName, index) => ({
      routeId: route.id,
      stopName,
      distanceFromOrigin: route.distance * index / segmentCount,
      priceFromOrigin: route.price * index / segmentCount,
      order: index + 1,
      estimatedTime: route.departureTime,
    }));
    const segments = locations.slice(0, -1).map((fromLocation, index) => ({
      routeId: route.id,
      segmentOrder: index + 1,
      fromLocation,
      toLocation: locations[index + 1],
      distanceKm: route.distance / segmentCount,
      durationMinutes: Math.round(route.duration / segmentCount),
      basePrice: route.price / segmentCount,
    }));

    await prisma.$transaction(async (transaction) => {
      await transaction.routeStop.createMany({ data: stops, skipDuplicates: true });
      await transaction.routeSegment.createMany({ data: segments, skipDuplicates: true });
      await transaction.route.update({
        where: { id: route.id },
        data: { segmentEnabled: true },
      });
    });
  }
}

/**
 * Calculate segment price with date-based variations
 */
async function calculateSegmentPrice(
  segment: any,
  travelDate?: Date
): Promise<SegmentPriceCalculation> {
  let finalPrice = Number(segment.basePrice);
  const adjustments: { type: string; amount: number; reason: string }[] = [];

  if (!travelDate) {
    return {
      segmentId: segment.id,
      basePrice: Number(segment.basePrice),
      adjustments: [],
      finalPrice,
    };
  }

  // Apply active price variations
  for (const variation of segment.priceVariations || []) {
    if (!variation.active) continue;

    const isApplicable = isDateApplicable(variation, travelDate);
    if (!isApplicable) continue;

    let adjustmentAmount = 0;
    if (variation.adjustmentType === 'percentage') {
      adjustmentAmount =
        Number(segment.basePrice) * (Number(variation.priceAdjustment) / 100);
    } else {
      adjustmentAmount = Number(variation.priceAdjustment);
    }

    finalPrice += adjustmentAmount;
    adjustments.push({
      type: variation.variationType,
      amount: adjustmentAmount,
      reason: getVariationReason(variation),
    });
  }

  return {
    segmentId: segment.id,
    basePrice: Number(segment.basePrice),
    adjustments,
    finalPrice,
  };
}

/**
 * Check if price variation applies to given date
 */
function isDateApplicable(variation: any, date: Date): boolean {
  const dayName = date
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();
  const dateStr = date.toISOString().split('T')[0];

  // Check day-based rules (e.g., weekends)
  if (variation.appliesToDates?.days) {
    const days = variation.appliesToDates.days as string[];
    if (days.includes(dayName)) return true;
  }

  // Check specific dates (e.g., holidays)
  if (variation.appliesToDates?.dates) {
    const dates = variation.appliesToDates.dates as string[];
    if (dates.includes(dateStr)) return true;
  }

  // Check date range
  if (variation.startDate && variation.endDate) {
    const start = new Date(variation.startDate);
    const end = new Date(variation.endDate);
    if (date >= start && date <= end) return true;
  }

  return false;
}

/**
 * Get human-readable reason for price variation
 */
function getVariationReason(variation: any): string {
  switch (variation.variationType) {
    case 'weekend':
      return 'Weekend premium';
    case 'holiday':
      return 'Holiday surcharge';
    case 'peak_season':
      return 'Peak season pricing';
    default:
      return 'Special pricing';
  }
}

/**
 * Create segments for a new route
 */
export async function createRouteSegments(routeId: string, locations: {
  name: string;
  distanceKm?: number;
  durationMinutes?: number;
  price: number;
}[]) {
  const segments: Array<{
    routeId: string;
    segmentOrder: number;
    fromLocation: string;
    toLocation: string;
    distanceKm?: number;
    durationMinutes?: number;
    basePrice: number;
  }> = [];
  
  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i];
    const to = locations[i + 1];
    
    segments.push({
      routeId,
      segmentOrder: i + 1,
      fromLocation: from.name,
      toLocation: to.name,
      distanceKm: to.distanceKm,
      durationMinutes: to.durationMinutes,
      basePrice: to.price - from.price,
    });
  }

  await prisma.routeSegment.createMany({ data: segments });
  
  return segments;
}

/** Keep booking stop totals aligned with the editable segment fares. */
export async function syncStopsFromSegments(routeId: string): Promise<void> {
  const [route, segments] = await Promise.all([
    prisma.route.findUnique({ where: { id: routeId }, select: { departureTime: true } }),
    prisma.routeSegment.findMany({
      where: { routeId },
      orderBy: { segmentOrder: 'asc' },
    }),
  ]);

  if (!route || segments.length === 0) return;

  let distanceFromOrigin = 0;
  let priceFromOrigin = 0;
  let durationFromOrigin = 0;
  const stops = [{
    stopName: segments[0].fromLocation,
    distanceFromOrigin,
    priceFromOrigin,
    order: 1,
    estimatedTime: route.departureTime,
  }];

  for (const segment of segments) {
    distanceFromOrigin += Number(segment.distanceKm || 0);
    priceFromOrigin += Number(segment.basePrice);
    durationFromOrigin += segment.durationMinutes || 0;
    stops.push({
      stopName: segment.toLocation,
      distanceFromOrigin,
      priceFromOrigin,
      order: stops.length + 1,
      estimatedTime: route.departureTime,
    });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.routeStop.deleteMany({ where: { routeId } });
    await transaction.routeStop.createMany({ data: stops.map(stop => ({ ...stop, routeId })) });
    await transaction.route.update({
      where: { id: routeId },
      data: {
        distance: distanceFromOrigin,
        duration: durationFromOrigin,
        price: priceFromOrigin,
        segmentEnabled: true,
      },
    });
  });
}

export default {
  searchRoutesWithSegments,
  calculateSegmentPrice,
  createRouteSegments,
  materializeLegacyViaRoutes,
  syncStopsFromSegments,
};
