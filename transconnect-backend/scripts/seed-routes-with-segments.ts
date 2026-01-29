import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create sample routes with stopovers and segments for testing
 */
async function seedRoutesWithSegments() {
  console.log('🌱 Seeding routes with stopovers and segments...\n');

  try {
    // Get first operator
    const operator = await prisma.operator.findFirst();
    if (!operator) {
      console.error('❌ No operator found. Please create an operator first.');
      process.exit(1);
    }

    // Get first bus
    const bus = await prisma.bus.findFirst({
      where: { operatorId: operator.id }
    });
    if (!bus) {
      console.error('❌ No bus found. Please create a bus first.');
      process.exit(1);
    }

    console.log(`✅ Using operator: ${operator.companyName}`);
    console.log(`✅ Using bus: ${bus.plateNumber}\n`);

    // Create route with stopovers: Kampala → Fort Portal
    console.log('📍 Creating route: Kampala → Fort Portal (via Mityana, Mubende)');
    
    const fortPortalRoute = await prisma.route.create({
      data: {
        id: 'kampala-fortportal-0800',
        origin: 'Kampala',
        destination: 'Fort Portal',
        via: 'Mityana,Mubende',
        distance: 300,
        duration: 300, // 5 hours
        price: 30000,
        departureTime: '08:00',
        operatorId: operator.id,
        busId: bus.id,
        segmentEnabled: true,
        active: true
      }
    });

    // Create segments for Kampala → Fort Portal
    const fortPortalSegments = [
      {
        routeId: fortPortalRoute.id,
        segmentOrder: 1,
        fromLocation: 'Kampala',
        toLocation: 'Mityana',
        distanceKm: new Prisma.Decimal(75),
        durationMinutes: 75,
        basePrice: new Prisma.Decimal(8000)
      },
      {
        routeId: fortPortalRoute.id,
        segmentOrder: 2,
        fromLocation: 'Mityana',
        toLocation: 'Mubende',
        distanceKm: new Prisma.Decimal(75),
        durationMinutes: 75,
        basePrice: new Prisma.Decimal(7000)
      },
      {
        routeId: fortPortalRoute.id,
        segmentOrder: 3,
        fromLocation: 'Mubende',
        toLocation: 'Fort Portal',
        distanceKm: new Prisma.Decimal(150),
        durationMinutes: 150,
        basePrice: new Prisma.Decimal(15000)
      }
    ];

    await prisma.routeSegment.createMany({
      data: fortPortalSegments
    });

    console.log(`✅ Created ${fortPortalSegments.length} segments`);
    fortPortalSegments.forEach((seg, idx) => {
      console.log(`   ${idx + 1}. ${seg.fromLocation} → ${seg.toLocation}: ${seg.distanceKm}km, UGX ${seg.basePrice}`);
    });

    // Create route with stopovers: Kampala → Mbarara
    console.log('\n📍 Creating route: Kampala → Mbarara (via Masaka, Lyantonde)');
    
    const mbararaRoute = await prisma.route.create({
      data: {
        id: 'kampala-mbarara-with-stops',
        origin: 'Kampala',
        destination: 'Mbarara',
        via: 'Masaka,Lyantonde',
        distance: 270,
        duration: 270, // 4.5 hours
        price: 25000,
        departureTime: '09:00',
        operatorId: operator.id,
        busId: bus.id,
        segmentEnabled: true,
        active: true
      }
    });

    // Create segments for Kampala → Mbarara
    const mbararaSegments = [
      {
        routeId: mbararaRoute.id,
        segmentOrder: 1,
        fromLocation: 'Kampala',
        toLocation: 'Masaka',
        distanceKm: new Prisma.Decimal(125),
        durationMinutes: 90,
        basePrice: new Prisma.Decimal(10000)
      },
      {
        routeId: mbararaRoute.id,
        segmentOrder: 2,
        fromLocation: 'Masaka',
        toLocation: 'Lyantonde',
        distanceKm: new Prisma.Decimal(65),
        durationMinutes: 60,
        basePrice: new Prisma.Decimal(6000)
      },
      {
        routeId: mbararaRoute.id,
        segmentOrder: 3,
        fromLocation: 'Lyantonde',
        toLocation: 'Mbarara',
        distanceKm: new Prisma.Decimal(80),
        durationMinutes: 120,
        basePrice: new Prisma.Decimal(9000)
      }
    ];

    await prisma.routeSegment.createMany({
      data: mbararaSegments
    });

    console.log(`✅ Created ${mbararaSegments.length} segments`);
    mbararaSegments.forEach((seg, idx) => {
      console.log(`   ${idx + 1}. ${seg.fromLocation} → ${seg.toLocation}: ${seg.distanceKm}km, UGX ${seg.basePrice}`);
    });

    // Add weekend pricing variation for Kampala → Masaka segment
    console.log('\n💰 Adding weekend pricing variation (+20% for Saturdays/Sundays)');
    
    const firstSegment = await prisma.routeSegment.findFirst({
      where: {
        routeId: mbararaRoute.id,
        segmentOrder: 1
      }
    });

    if (firstSegment) {
      await prisma.segmentPriceVariation.create({
        data: {
          segmentId: firstSegment.id,
          variationType: 'weekend',
          priceAdjustment: new Prisma.Decimal(20), // 20% increase
          adjustmentType: 'percentage',
          appliesToDates: {
            days: ['saturday', 'sunday']
          },
          active: true
        }
      });
      console.log(`✅ Weekend premium added: +20% for Kampala → Masaka`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Seed data created successfully!');
    console.log('='.repeat(60));
    console.log('\n📝 Test scenarios you can now run:');
    console.log('  1. Search for "Mityana" as destination - should find Kampala → Mityana');
    console.log('  2. Search for "Masaka" as destination - should find Kampala → Masaka');
    console.log('  3. Search from "Masaka" to "Mbarara" - should find the segment');
    console.log('  4. Weekend prices should be 20% higher for Kampala → Masaka\n');

  } catch (error: any) {
    console.error('\n❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedRoutesWithSegments()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedRoutesWithSegments;
