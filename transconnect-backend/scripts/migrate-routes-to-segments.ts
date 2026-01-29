import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteWithSegments {
  id: string;
  origin: string;
  destination: string;
  via: string | null;
  distance: number;
  duration: number;
  price: number;
  segmentEnabled: boolean;
}

/**
 * Migration script to convert existing routes with stopovers (via field)
 * into route_segments for stopover-based pricing
 */
async function migrateRoutesToSegments() {
  console.log('🚀 Starting route segments migration...\n');

  try {
    // Get all routes that have stopovers but no segments yet
    const routes = await prisma.route.findMany({
      where: {
        OR: [
          { via: { not: null } },
          { via: { not: '' } }
        ],
        segmentEnabled: true
      },
      include: {
        segments: true
      }
    });

    console.log(`📊 Found ${routes.length} routes with stopovers\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const route of routes) {
      // Skip if segments already exist
      if (route.segments.length > 0) {
        console.log(`⏭️  Skipping route ${route.id} (${route.origin} → ${route.destination}) - segments already exist`);
        skippedCount++;
        continue;
      }

      try {
        console.log(`\n🔄 Processing route: ${route.origin} → ${route.destination}`);
        
        // Parse stopovers from via field
        const stopovers = route.via ? route.via.split(',').map(s => s.trim()).filter(s => s) : [];
        
        if (stopovers.length === 0) {
          console.log(`  ⚠️  No stopovers found in via field: "${route.via}"`);
          skippedCount++;
          continue;
        }

        console.log(`  📍 Stopovers: ${stopovers.join(' → ')}`);

        // Build complete journey: origin → stopovers → destination
        const allLocations = [route.origin, ...stopovers, route.destination];
        const totalSegments = allLocations.length - 1;

        console.log(`  🗺️  Creating ${totalSegments} segments...`);

        // Calculate proportional pricing based on distance
        // If we don't have individual segment distances, divide equally
        const avgDistancePerSegment = route.distance / totalSegments;
        const avgDurationPerSegment = Math.round(route.duration / totalSegments);
        const avgPricePerSegment = route.price / totalSegments;

        // Create segments
        const segments: Prisma.RouteSegmentCreateManyInput[] = [];
        
        for (let i = 0; i < totalSegments; i++) {
          const fromLocation = allLocations[i];
          const toLocation = allLocations[i + 1];
          
          // Proportional pricing
          const basePrice = avgPricePerSegment;
          
          segments.push({
            routeId: route.id,
            segmentOrder: i + 1,
            fromLocation,
            toLocation,
            distanceKm: new Prisma.Decimal(avgDistancePerSegment.toFixed(2)),
            durationMinutes: avgDurationPerSegment,
            basePrice: new Prisma.Decimal(basePrice.toFixed(2))
          });

          console.log(`  ✅ Segment ${i + 1}: ${fromLocation} → ${toLocation} (${avgDistancePerSegment.toFixed(1)}km, UGX ${basePrice.toFixed(0)})`);
        }

        // Insert segments in a transaction
        await prisma.routeSegment.createMany({
          data: segments
        });

        console.log(`  ✨ Successfully created ${segments.length} segments for route ${route.id}`);
        migratedCount++;

      } catch (error: any) {
        console.error(`  ❌ Error processing route ${route.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully migrated: ${migratedCount} routes`);
    console.log(`⏭️  Skipped: ${skippedCount} routes`);
    console.log(`❌ Errors: ${errorCount} routes`);
    console.log('='.repeat(60) + '\n');

    if (migratedCount > 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('  1. Test stopover searches in the application');
      console.log('  2. Verify pricing calculations are correct');
      console.log('  3. Update admin UI to manage segments');
      console.log('  4. Consider adding date-based price variations\n');
    }

  } catch (error: any) {
    console.error('\n💥 Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrateRoutesToSegments()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default migrateRoutesToSegments;
