const { PrismaClient } = require('@prisma/client');

async function addRouteStops() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log('🛤️ Adding Route Stops for existing routes...\n');
    
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

    console.log(`Found ${routes.length} active routes to enhance with stops:\n`);

    // Add stops for Kampala → Jinja route
    const kampalajinjaRoute = routes.find(r => 
      r.origin.toLowerCase().includes('kampala') && 
      r.destination.toLowerCase().includes('jinja')
    );

    if (kampalajinjaRoute) {
      console.log('Adding stops for Kampala → Jinja route...');
      
      const jinjaStops = [
        { stopName: 'Kampala (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '08:00' },
        { stopName: 'Mukono', distanceFromOrigin: 25, priceFromOrigin: 5000, order: 2, estimatedTime: '08:30' },
        { stopName: 'Lugazi', distanceFromOrigin: 45, priceFromOrigin: 8000, order: 3, estimatedTime: '09:00' },
        { stopName: 'Njeru', distanceFromOrigin: 75, priceFromOrigin: 12000, order: 4, estimatedTime: '09:30' },
        { stopName: 'Jinja (Destination)', distanceFromOrigin: kampalajinjaRoute.distance, priceFromOrigin: kampalajinjaRoute.price, order: 5, estimatedTime: '10:00' }
      ];

      for (const stop of jinjaStops) {
        await prisma.routeStop.upsert({
          where: { 
            routeId_order: {
              routeId: kampalajinjaRoute.id,
              order: stop.order
            }
          },
          create: {
            routeId: kampalajinjaRoute.id,
            ...stop
          },
          update: {
            ...stop
          }
        });
      }
      console.log('✅ Added 5 stops for Kampala → Jinja');
    }

    // Add stops for Kampala → Mbarara route (longer route)
    const kampalaaMbararaRoute = routes.find(r => 
      r.origin.toLowerCase().includes('kampala') && 
      r.destination.toLowerCase().includes('mbarara')
    );

    if (kampalaaMbararaRoute) {
      console.log('Adding stops for Kampala → Mbarara route...');
      
      const mbararaStops = [
        { stopName: 'Kampala (Origin)', distanceFromOrigin: 0, priceFromOrigin: 0, order: 1, estimatedTime: '07:00' },
        { stopName: 'Mpigi', distanceFromOrigin: 35, priceFromOrigin: 6000, order: 2, estimatedTime: '07:45' },
        { stopName: 'Masaka', distanceFromOrigin: 125, priceFromOrigin: 15000, order: 3, estimatedTime: '09:30' },
        { stopName: 'Lyantonde', distanceFromOrigin: 180, priceFromOrigin: 20000, order: 4, estimatedTime: '10:45' },
        { stopName: 'Mbarara (Destination)', distanceFromOrigin: kampalaaMbararaRoute.distance, priceFromOrigin: kampalaaMbararaRoute.price, order: 5, estimatedTime: '12:00' }
      ];

      for (const stop of mbararaStops) {
        await prisma.routeStop.upsert({
          where: { 
            routeId_order: {
              routeId: kampalaaMbararaRoute.id,
              order: stop.order
            }
          },
          create: {
            routeId: kampalaaMbararaRoute.id,
            ...stop
          },
          update: {
            ...stop
          }
        });
      }
      console.log('✅ Added 5 stops for Kampala → Mbarara');
    }

    // Show summary
    const totalStops = await prisma.routeStop.count();
    console.log(`\n🎯 Route Stops System Ready!`);
    console.log(`📊 Total stops created: ${totalStops}`);
    
    // Show example stop data
    const sampleRoute = await prisma.route.findFirst({
      where: { active: true },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (sampleRoute && sampleRoute.stops.length > 0) {
      console.log(`\n📋 Example: ${sampleRoute.origin} → ${sampleRoute.destination} stops:`);
      sampleRoute.stops.forEach(stop => {
        console.log(`  ${stop.order}. ${stop.stopName} - ${stop.distanceFromOrigin}km - UGX ${stop.priceFromOrigin.toLocaleString()} - ${stop.estimatedTime}`);
      });
    }

  } catch (error) {
    console.error('❌ Error adding route stops:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addRouteStops();