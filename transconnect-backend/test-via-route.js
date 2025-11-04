const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestRouteWithVia() {
  try {
    // Get first operator and bus
    const operator = await prisma.operator.findFirst();
    const bus = await prisma.bus.findFirst({
      where: { operatorId: operator.id }
    });

    if (!operator || !bus) {
      console.log('No operator or bus found. Please run seed script first.');
      return;
    }

    // Create a route with via field
    const route = await prisma.route.create({
      data: {
        origin: 'Kampala',
        destination: 'Gulu',
        via: 'Masindi, Karuma',
        distance: 340.5,
        duration: 300, // 5 hours
        price: 35000,
        departureTime: '08:00',
        operatorId: operator.id,
        busId: bus.id,
        active: true
      },
      include: {
        operator: {
          select: {
            companyName: true
          }
        },
        bus: {
          select: {
            plateNumber: true,
            model: true
          }
        }
      }
    });

    console.log('✅ Test route with via field created successfully:');
    console.log(`   Route: ${route.origin} → ${route.destination} (via ${route.via})`);
    console.log(`   Operator: ${route.operator.companyName}`);
    console.log(`   Bus: ${route.bus.plateNumber} - ${route.bus.model}`);
    console.log(`   Price: UGX ${route.price.toLocaleString()}`);
    console.log(`   Departure: ${route.departureTime}`);

    // Create another route without via field for comparison
    const route2 = await prisma.route.create({
      data: {
        origin: 'Kampala',
        destination: 'Mbarara',
        distance: 290.0,
        duration: 240, // 4 hours
        price: 28000,
        departureTime: '10:30',
        operatorId: operator.id,
        busId: bus.id,
        active: true
      },
      include: {
        operator: {
          select: {
            companyName: true
          }
        }
      }
    });

    console.log('\n✅ Regular route (without via) created:');
    console.log(`   Route: ${route2.origin} → ${route2.destination}`);
    console.log(`   Price: UGX ${route2.price.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error creating test routes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestRouteWithVia();