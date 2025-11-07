const { PrismaClient } = require('@prisma/client');

async function checkBusCapacities() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log('🚌 Checking Bus Capacities in Production...\n');
    
    // Get all buses with their capacities
    const buses = await prisma.bus.findMany({
      select: {
        id: true,
        plateNumber: true,
        model: true,
        capacity: true,
        active: true,
        operator: {
          select: {
            companyName: true
          }
        },
        routes: {
          select: {
            id: true,
            origin: true,
            destination: true,
            active: true
          }
        }
      },
      orderBy: {
        capacity: 'desc'
      }
    });

    console.log(`Found ${buses.length} buses:\n`);
    
    buses.forEach((bus, index) => {
      console.log(`${index + 1}. ${bus.plateNumber} (${bus.model})`);
      console.log(`   Capacity: ${bus.capacity} seats`);
      console.log(`   Operator: ${bus.operator.companyName}`);
      console.log(`   Status: ${bus.active ? 'Active' : 'Inactive'}`);
      console.log(`   Routes: ${bus.routes.length} route(s)`);
      
      if (bus.routes.length > 0) {
        bus.routes.forEach(route => {
          console.log(`     - ${route.origin} → ${route.destination} (${route.active ? 'Active' : 'Inactive'})`);
        });
      }
      console.log('');
    });

    // Check for buses with high capacity
    const highCapacityBuses = buses.filter(bus => bus.capacity > 50);
    if (highCapacityBuses.length > 0) {
      console.log('🔍 High Capacity Buses (>50 seats):');
      highCapacityBuses.forEach(bus => {
        console.log(`   ${bus.plateNumber}: ${bus.capacity} seats`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusCapacities();