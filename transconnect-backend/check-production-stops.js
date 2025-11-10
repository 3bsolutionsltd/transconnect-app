// Production database seed check script
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function checkProductionStops() {
  try {
    console.log('=== PRODUCTION DATABASE CHECK ===\n');
    
    // Check routes
    const routes = await prisma.route.findMany({
      select: { id: true, origin: true, destination: true }
    });
    console.log('Routes in production:');
    routes.forEach(route => {
      console.log(`  ${route.id}: ${route.origin} -> ${route.destination}`);
    });
    
    // Check route stops
    const stops = await prisma.routeStop.findMany({
      select: { id: true, routeId: true, stopName: true }
    });
    console.log('\nRoute stops in production:', stops.length);
    stops.forEach(stop => {
      console.log(`  ${stop.routeId}: ${stop.stopName}`);
    });
    
    // Test specific route
    const testRoute = await prisma.route.findUnique({
      where: { id: 'kampala-jinja-0800' },
      include: {
        stops: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    console.log('\nTest route kampala-jinja-0800:');
    console.log('Route exists:', !!testRoute);
    console.log('Stops count:', testRoute?.stops?.length || 0);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionStops();