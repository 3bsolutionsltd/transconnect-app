/**
 * Data Migration: Convert existing routes with RouteStops to RouteSegments
 * 
 * This script migrates existing routes to the new segment-based model:
 * 1. For each route, create segments from origin -> stops -> destination
 * 2. Split prices proportionally based on distance
 * 3. Preserve backward compatibility by keeping original route data
 * 
 * Run with: node scripts/migrate-to-route-segments.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRouteToSegments() {
  console.log('🚀 Starting route segment migration...\n');

  try {
    // Get all active routes with their stops
    const routes = await prisma.route.findMany({
      where: { active: true },
      include: { stops: { orderBy: { order: 'asc' } } },
    });

    console.log(`📍 Found ${routes.length} routes to migrate\n`);

    let totalSegments = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const route of routes) {
      try {
        console.log(`Processing route: ${route.origin} → ${route.destination}`);

        // Build location sequence: origin -> stops -> destination
        const locations = [
          { name: route.origin, distance: 0, price: 0 },
          ...route.stops.map(stop => ({
            name: stop.stopName,
            distance: stop.distanceFromOrigin,
            price: stop.priceFromOrigin,
          })),
          { name: route.destination, distance: route.distance, price: route.price },
        ];

        // Create segments between consecutive locations
        const segments = [];
        for (let i = 0; i < locations.length - 1; i++) {
          const from = locations[i];
          const to = locations[i + 1];

          const segmentDistance = to.distance - from.distance;
          const segmentPrice = to.price - from.price;

          segments.push({
            routeId: route.id,
            segmentOrder: i + 1,
            fromLocation: from.name,
            toLocation: to.name,
            distanceKm: segmentDistance,
            durationMinutes: Math.round(
              (segmentDistance / route.distance) * route.duration
            ), // Proportional duration
            basePrice: segmentPrice,
          });
        }

        // Insert segments in transaction
        await prisma.$transaction(async (tx) => {
          // Delete existing segments (if any)
          await tx.routeSegment.deleteMany({
            where: { routeId: route.id },
          });

          // Create new segments
          await tx.routeSegment.createMany({
            data: segments,
          });

          // Mark route as segment-enabled
          await tx.route.update({
            where: { id: route.id },
            data: { segmentEnabled: true },
          });
        });

        totalSegments += segments.length;
        successCount++;
        console.log(`  ✅ Created ${segments.length} segments\n`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error processing route ${route.id}:`, error.message);
        console.error(`     ${error}\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total routes processed: ${routes.length}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📦 Total segments created: ${totalSegments}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('1. Test segment-based search: /api/routes/search');
      console.log('2. Verify segment pricing calculations');
      console.log('3. Update admin UI to manage segments');
    } else {
      console.log('⚠️  Migration completed with errors. Please review failed routes.');
    }
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run migration
migrateRouteToSegments()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
