/**
 * Add segments to existing routes that don't have them
 * This makes existing routes searchable via the segment-based search API
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSegmentsToExistingRoutes() {
  try {
    console.log('🔧 Adding segments to existing routes...');
    
    // Find all active routes
    const routes = await prisma.route.findMany({
      where: { active: true },
      include: {
        segments: true
      }
    });

    console.log(`📊 Found ${routes.length} active routes`);

    let updated = 0;
    let skipped = 0;

    for (const route of routes) {
      // Skip if route already has segments
      if (route.segments && route.segments.length > 0) {
        console.log(`⏭️ Route ${route.id} already has ${route.segments.length} segments`);
        skipped++;
        continue;
      }

      console.log(`✨ Adding segment for route: ${route.origin} → ${route.destination}`);

      // Create a simple segment from origin to destination
      await prisma.routeSegment.create({
        data: {
          routeId: route.id,
          segmentOrder: 1,
          fromLocation: route.origin,
          toLocation: route.destination,
          distanceKm: route.distance || 0,
          durationMinutes: route.duration || 0,
          basePrice: route.price,
        }
      });

      // Enable segments for this route
      await prisma.route.update({
        where: { id: route.id },
        data: { segmentEnabled: true }
      });

      updated++;
    }

    console.log(`✅ Added segments to ${updated} routes`);
    console.log(`⏭️ Skipped ${skipped} routes (already had segments)`);
    
  } catch (error) {
    console.error('❌ Error adding segments:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addSegmentsToExistingRoutes();
