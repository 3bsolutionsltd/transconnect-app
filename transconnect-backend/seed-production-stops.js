// Add route stops to production database
const { PrismaClient } = require('@prisma/client');

async function addRouteStopsProduction() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log('🛤️ Adding Route Stops to Production Database...\n');
    
    // Get existing routes
    const routes = await prisma.route.findMany({
      where: { active: true },
      select: {
        id: true,
        origin: true,
        destination: true,
        distance: true,
        price: true
      }
    });

    console.log(`Found ${routes.length} active routes\n`);

    for (const route of routes) {
      console.log(`Processing: ${route.origin} → ${route.destination}`);
      
      // Delete existing stops
      await prisma.routeStop.deleteMany({
        where: { routeId: route.id }
      });

      let stops = [];

      // Add stops based on route
      if (route.origin.toLowerCase().includes('kampala') && route.destination.toLowerCase().includes('jinja')) {
        stops = [
          { stopName: 'Kampala (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '08:00' },
          { stopName: 'Mukono', distanceFromOrigin: 25, priceFromOrigin: 5000, order: 2, estimatedTime: '08:30' },
          { stopName: 'Lugazi', distanceFromOrigin: 45, priceFromOrigin: 8000, order: 3, estimatedTime: '09:00' },
          { stopName: 'Njeru', distanceFromOrigin: 75, priceFromOrigin: 12000, order: 4, estimatedTime: '09:30' },
          { stopName: 'Jinja (Destination)', distanceFromOrigin: route.distance, priceFromOrigin: route.price, order: 5, estimatedTime: '10:00' }
        ];
      } 
      else if (route.origin.toLowerCase().includes('kampala') && route.destination.toLowerCase().includes('mbarara')) {
        stops = [
          { stopName: 'Kampala (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '07:00' },
          { stopName: 'Mpigi', distanceFromOrigin: 35, priceFromOrigin: 6000, order: 2, estimatedTime: '07:45' },
          { stopName: 'Masaka', distanceFromOrigin: 125, priceFromOrigin: 15000, order: 3, estimatedTime: '09:30' },
          { stopName: 'Lyantonde', distanceFromOrigin: 180, priceFromOrigin: 20000, order: 4, estimatedTime: '10:45' },
          { stopName: 'Mbarara (Destination)', distanceFromOrigin: route.distance, priceFromOrigin: route.price, order: 5, estimatedTime: '12:00' }
        ];
      }
      else if (route.origin.toLowerCase().includes('kampala') && route.destination.toLowerCase().includes('gulu')) {
        stops = [
          { stopName: 'Kampala (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '06:00' },
          { stopName: 'Luweero', distanceFromOrigin: 75, priceFromOrigin: 8000, order: 2, estimatedTime: '07:30' },
          { stopName: 'Nakasongola', distanceFromOrigin: 125, priceFromOrigin: 12000, order: 3, estimatedTime: '08:30' },
          { stopName: 'Karuma', distanceFromOrigin: 225, priceFromOrigin: 18000, order: 4, estimatedTime: '10:30' },
          { stopName: 'Lira', distanceFromOrigin: 285, priceFromOrigin: 22000, order: 5, estimatedTime: '12:00' },
          { stopName: 'Gulu (Destination)', distanceFromOrigin: route.distance, priceFromOrigin: route.price, order: 6, estimatedTime: '14:00' }
        ];
      }
      else {
        // Generic route with origin and destination only
        stops = [
          { stopName: route.origin + ' (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '08:00' },
          { stopName: route.destination + ' (Destination)', distanceFromOrigin: route.distance, priceFromOrigin: route.price, order: 2, estimatedTime: '10:00' }
        ];
      }

      // Create stops
      for (const stop of stops) {
        await prisma.routeStop.create({
          data: {
            routeId: route.id,
            ...stop
          }
        });
      }

      console.log(`  ✅ Added ${stops.length} stops`);
    }

    // Show summary
    const totalStops = await prisma.routeStop.count();
    console.log(`\n🎯 Route Stops System Ready!`);
    console.log(`📊 Total stops created: ${totalStops}`);
    
    // Show example
    const sampleRoute = await prisma.route.findFirst({
      where: { active: true },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (sampleRoute && sampleRoute.stops.length > 0) {
      console.log(`\n📋 Example: ${sampleRoute.origin} → ${sampleRoute.destination}:`);
      sampleRoute.stops.forEach(stop => {
        console.log(`  ${stop.order}. ${stop.stopName} - ${stop.distanceFromOrigin}km - UGX ${stop.priceFromOrigin.toLocaleString()}`);
      });
    }

    console.log('\n🚀 Route stops data is now in production database!');

  } catch (error) {
    console.error('❌ Error adding route stops:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run with production database URL
addRouteStopsProduction();