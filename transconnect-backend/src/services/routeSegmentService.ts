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

  // TODO: Fix SQL query - for now return empty since no segments exist yet
  // Will work once we add test data with segments
  console.log(`Segment search called: ${origin} → ${destination}`);
  return [];

  /* Commented out until we have segment test data
  // SQL query to find all routes where origin and destination match any segment
  const query = Prisma.sql`
    WITH route_connections AS (
      SELECT DISTINCT 
        r.id as route_id,
        r.origin,
        r.destination,
        r."departureTime",
        r."operatorId",
        r."busId",
        rs1."fromLocation" as pickup,
        rs2."toLocation" as dropoff,
        rs1."segmentOrder" as start_order,
        rs2."segmentOrder" as end_order
      FROM routes r
      JOIN route_segments rs1 ON rs1."routeId" = r.id
      JOIN route_segments rs2 ON rs2."routeId" = r.id
      WHERE r.active = true
        AND r."segmentEnabled" = true
        AND rs1."fromLocation" ILIKE ${`%${origin}%`}
        AND rs2."toLocation" ILIKE ${`%${destination}%`}
        AND rs1."segmentOrder" <= rs2."segmentOrder"
    )
    SELECT * FROM route_connections
    ORDER BY route_id;
  `;

  const rawResults = await prisma.$queryRaw<any[]>(query);

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
  */
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

export default {
  searchRoutesWithSegments,
  calculateSegmentPrice,
  createRouteSegments,
};
