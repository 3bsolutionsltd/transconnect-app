/**
 * Batch Update Route and Segment Distances
 * 
 * This script updates all existing routes and segments with accurate
 * distances and durations calculated via Google Maps Distance Matrix API.
 * 
 * Usage:
 *   npm run update-distances
 * 
 * Requirements:
 *   - GOOGLE_MAPS_API_KEY must be set in .env
 *   - Database must be accessible
 */

import { PrismaClient } from '@prisma/client';
import { GoogleMapsService } from '../src/services/googleMaps.service';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const googleMapsService = GoogleMapsService.getInstance();

interface UpdateStats {
  routesProcessed: number;
  routesUpdated: number;
  routesFailed: number;
  segmentsProcessed: number;
  segmentsUpdated: number;
  segmentsFailed: number;
}

async function updateRouteDistances(stats: UpdateStats) {
  console.log('\n📍 Updating Route Distances');
  console.log('='.repeat(60));

  // Fetch all routes
  const routes = await prisma.route.findMany({
    where: {
      active: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${routes.length} active routes\n`);

  for (const route of routes) {
    stats.routesProcessed++;
    
    const needsUpdate = !route.distance || !route.duration;
    const statusIcon = needsUpdate ? '🔄' : '✓';
    
    console.log(`${statusIcon} Route ${stats.routesProcessed}/${routes.length}: ${route.origin} → ${route.destination}`);
    
    if (!needsUpdate) {
      console.log(`   Already has distance: ${route.distance}km, ${route.duration}min`);
      continue;
    }

    try {
      console.log(`   Calculating distance...`);
      
      const calculation = await googleMapsService.calculateDistance(
        route.origin,
        route.destination
      );

      if (calculation.success) {
        // Update route with calculated values
        await prisma.route.update({
          where: { id: route.id },
          data: {
            distance: route.distance || calculation.distanceKm,
            duration: route.duration || calculation.durationMinutes,
          },
        });

        stats.routesUpdated++;
        console.log(`   ✅ Updated: ${calculation.distanceKm}km, ${calculation.durationMinutes}min`);
      } else {
        stats.routesFailed++;
        console.log(`   ❌ Failed: ${calculation.error}`);
      }

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      stats.routesFailed++;
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\nRoute Update Summary:');
  console.log(`  ✅ Updated: ${stats.routesUpdated}`);
  console.log(`  ❌ Failed: ${stats.routesFailed}`);
  console.log(`  ⏭️  Skipped: ${stats.routesProcessed - stats.routesUpdated - stats.routesFailed}`);
}

async function updateSegmentDistances(stats: UpdateStats) {
  console.log('\n\n📍 Updating Route Segment Distances');
  console.log('='.repeat(60));

  // Fetch all route segments
  const segments = await prisma.routeSegment.findMany({
    include: {
      route: {
        select: {
          id: true,
          origin: true,
          destination: true,
        },
      },
    },
    orderBy: [
      { routeId: 'asc' },
      { segmentOrder: 'asc' },
    ],
  });

  console.log(`Found ${segments.length} route segments\n`);

  // Group segments by route for better logging
  const segmentsByRoute = segments.reduce((acc, segment) => {
    if (!acc[segment.routeId]) {
      acc[segment.routeId] = [];
    }
    acc[segment.routeId].push(segment);
    return acc;
  }, {} as Record<string, typeof segments>);

  let currentRouteId = '';
  
  for (const segment of segments) {
    stats.segmentsProcessed++;

    // Log route header when switching routes
    if (segment.routeId !== currentRouteId) {
      currentRouteId = segment.routeId;
      console.log(`\n🚌 Route: ${segment.route.origin} → ${segment.route.destination}`);
    }

    const needsUpdate = !segment.distanceKm || !segment.durationMinutes;
    const statusIcon = needsUpdate ? '🔄' : '✓';
    
    console.log(`  ${statusIcon} Segment ${segment.segmentOrder}: ${segment.fromLocation} → ${segment.toLocation}`);
    
    if (!needsUpdate) {
      console.log(`     Already has distance: ${segment.distanceKm}km, ${segment.durationMinutes}min`);
      continue;
    }

    try {
      console.log(`     Calculating distance...`);
      
      const calculation = await googleMapsService.calculateDistance(
        segment.fromLocation,
        segment.toLocation
      );

      if (calculation.success) {
        // Update segment with calculated values
        await prisma.routeSegment.update({
          where: { id: segment.id },
          data: {
            distanceKm: segment.distanceKm || calculation.distanceKm,
            durationMinutes: segment.durationMinutes || calculation.durationMinutes,
          },
        });

        stats.segmentsUpdated++;
        console.log(`     ✅ Updated: ${calculation.distanceKm}km, ${calculation.durationMinutes}min`);
      } else {
        stats.segmentsFailed++;
        console.log(`     ❌ Failed: ${calculation.error}`);
      }

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error: any) {
      stats.segmentsFailed++;
      console.error(`     ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\nSegment Update Summary:');
  console.log(`  ✅ Updated: ${stats.segmentsUpdated}`);
  console.log(`  ❌ Failed: ${stats.segmentsFailed}`);
  console.log(`  ⏭️  Skipped: ${stats.segmentsProcessed - stats.segmentsUpdated - stats.segmentsFailed}`);
}

async function main() {
  console.log('🗺️  Batch Distance Update Script');
  console.log('='.repeat(60));
  console.log(`Started at: ${new Date().toLocaleString()}\n`);

  // Check if Google Maps service is enabled
  if (!googleMapsService.isEnabled()) {
    console.error('❌ Google Maps service is not enabled');
    console.error('Please set GOOGLE_MAPS_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('✅ Google Maps service is enabled');
  console.log('✅ Database connection established');

  const stats: UpdateStats = {
    routesProcessed: 0,
    routesUpdated: 0,
    routesFailed: 0,
    segmentsProcessed: 0,
    segmentsUpdated: 0,
    segmentsFailed: 0,
  };

  const startTime = Date.now();

  try {
    // Update routes
    await updateRouteDistances(stats);

    // Update segments
    await updateSegmentDistances(stats);

    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;

    // Final summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log('\nRoutes:');
    console.log(`  Total Processed: ${stats.routesProcessed}`);
    console.log(`  ✅ Updated: ${stats.routesUpdated}`);
    console.log(`  ❌ Failed: ${stats.routesFailed}`);
    console.log(`  ⏭️  Skipped: ${stats.routesProcessed - stats.routesUpdated - stats.routesFailed}`);
    
    console.log('\nSegments:');
    console.log(`  Total Processed: ${stats.segmentsProcessed}`);
    console.log(`  ✅ Updated: ${stats.segmentsUpdated}`);
    console.log(`  ❌ Failed: ${stats.segmentsFailed}`);
    console.log(`  ⏭️  Skipped: ${stats.segmentsProcessed - stats.segmentsUpdated - stats.segmentsFailed}`);
    
    console.log(`\n⏱️  Total Time: ${durationSeconds.toFixed(2)}s`);
    console.log(`\n✅ Batch update completed at: ${new Date().toLocaleString()}\n`);

    // Check if there were any failures
    const totalFailures = stats.routesFailed + stats.segmentsFailed;
    if (totalFailures > 0) {
      console.warn(`⚠️  Warning: ${totalFailures} items failed to update`);
      console.warn('Review the logs above for details\n');
    }

  } catch (error: any) {
    console.error('\n❌ Fatal error during batch update:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
