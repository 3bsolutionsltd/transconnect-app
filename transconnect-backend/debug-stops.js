const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugStops() {
  try {
    console.log('=== DEBUG: Route Stops Issue ===\n');
    
    // Check all routes
    const routes = await prisma.route.findMany({
      select: { id: true, origin: true, destination: true }
    });
    console.log('Routes in database:');
    routes.forEach(route => {
      console.log(`  ${route.id}: ${route.origin} -> ${route.destination}`);
    });
    console.log();
    
    // Check all route stops
    const allStops = await prisma.routeStop.findMany({
      select: { id: true, routeId: true, stopName: true, order: true }
    });
    console.log('Route stops in database:');
    allStops.forEach(stop => {
      console.log(`  RouteID: ${stop.routeId}, Stop: ${stop.stopName}, Order: ${stop.order}`);
    });
    console.log();
    
    // Test the exact query that the API uses
    if (routes.length > 0) {
      const testRouteId = routes[0].id;
      console.log(`Testing API query for route: ${testRouteId}`);
      
      const routeWithStops = await prisma.route.findUnique({
        where: { id: testRouteId },
        include: {
          stops: {
            orderBy: { order: 'asc' }
          }
        }
      });
      
      console.log('Route found:', !!routeWithStops);
      console.log('Stops found:', routeWithStops?.stops?.length || 0);
      if (routeWithStops?.stops) {
        routeWithStops.stops.forEach(stop => {
          console.log(`  - ${stop.stopName} (Order: ${stop.order})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error debugging stops:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStops();