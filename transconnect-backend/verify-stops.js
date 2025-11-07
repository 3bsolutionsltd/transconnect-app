const { PrismaClient } = require('@prisma/client');

async function verifyRouteStops() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Verifying Route Stops in Production Database...\n');
    
    // Check database connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Count routes
    const routeCount = await prisma.route.count();
    console.log(`📊 Total routes: ${routeCount}`);
    
    // Count route stops
    const stopCount = await prisma.routeStop.count();
    console.log(`🛤️ Total route stops: ${stopCount}`);
    
    // Get routes with their stops
    const routesWithStops = await prisma.route.findMany({
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log('\n📋 Routes and their stops:');
    routesWithStops.forEach(route => {
      console.log(`\n${route.origin} → ${route.destination} (${route.id})`);
      if (route.stops.length > 0) {
        route.stops.forEach(stop => {
          console.log(`  ${stop.order}. ${stop.stopName} - ${stop.distanceFromOrigin}km - UGX ${stop.priceFromOrigin.toLocaleString()}`);
        });
      } else {
        console.log('  ❌ No stops found');
      }
    });
    
    // If no stops, add them
    if (stopCount === 0) {
      console.log('\n🔧 No stops found, adding them now...');
      
      for (const route of routesWithStops) {
        let stops = [];
        
        if (route.origin.toLowerCase().includes('kampala') && route.destination.toLowerCase().includes('jinja')) {
          stops = [
            { stopName: 'Kampala (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '08:00' },
            { stopName: 'Mukono', distanceFromOrigin: 25, priceFromOrigin: 5000, order: 2, estimatedTime: '08:30' },
            { stopName: 'Lugazi', distanceFromOrigin: 45, priceFromOrigin: 8000, order: 3, estimatedTime: '09:00' },
            { stopName: 'Njeru', distanceFromOrigin: 75, priceFromOrigin: 12000, order: 4, estimatedTime: '09:30' },
            { stopName: 'Jinja (Destination)', distanceFromOrigin: route.distance, priceFromOrigin: route.price, order: 5, estimatedTime: '10:00' }
          ];
        } else {
          // Add basic origin and destination stops for other routes
          stops = [
            { stopName: route.origin + ' (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '08:00' },
            { stopName: route.destination + ' (Destination)', distanceFromOrigin: route.distance, priceFromOrigin: route.price, order: 2, estimatedTime: '10:00' }
          ];
        }
        
        for (const stop of stops) {
          await prisma.routeStop.create({
            data: {
              routeId: route.id,
              ...stop
            }
          });
        }
        
        console.log(`  ✅ Added ${stops.length} stops for ${route.origin} → ${route.destination}`);
      }
      
      const newStopCount = await prisma.routeStop.count();
      console.log(`\n🎯 Route stops creation complete! Total: ${newStopCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRouteStops();