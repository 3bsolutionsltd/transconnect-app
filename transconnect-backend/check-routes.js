// Quick test script to check routes in database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://transconnect_user:jT72cFJG8T6R5cGPMXqF3DUE7l9L5iRA@dpg-cs2b9elumphs73ca7k6g-a.oregon-postgres.render.com/transconnect_db'
});

async function checkRoutes() {
  try {
    console.log('🔍 Checking database routes...');
    
    const totalRoutes = await prisma.route.count();
    console.log(`📊 Total routes in database: ${totalRoutes}`);
    
    const activeRoutes = await prisma.route.count({
      where: { active: true }
    });
    console.log(`✅ Active routes: ${activeRoutes}`);
    
    const inactiveRoutes = await prisma.route.count({
      where: { active: false }
    });
    console.log(`❌ Inactive routes: ${inactiveRoutes}`);
    
    if (totalRoutes > 0) {
      console.log('\n📋 Sample routes:');
      const sampleRoutes = await prisma.route.findMany({
        take: 3,
        include: {
          operator: {
            select: {
              companyName: true,
              approved: true
            }
          },
          bus: {
            select: {
              plateNumber: true,
              capacity: true
            }
          }
        }
      });
      
      sampleRoutes.forEach((route, index) => {
        console.log(`${index + 1}. ${route.origin} → ${route.destination}`);
        console.log(`   - Active: ${route.active}`);
        console.log(`   - Operator: ${route.operator.companyName} (Approved: ${route.operator.approved})`);
        console.log(`   - Bus: ${route.bus.plateNumber} (${route.bus.capacity} seats)`);
        console.log(`   - Price: UGX ${route.price}`);
        console.log(`   - Departure: ${route.departureTime}`);
        console.log('');
      });
    }
    
    // Check operators
    const totalOperators = await prisma.operator.count();
    console.log(`👥 Total operators: ${totalOperators}`);
    
    const approvedOperators = await prisma.operator.count({
      where: { approved: true }
    });
    console.log(`✅ Approved operators: ${approvedOperators}`);
    
    // Check buses
    const totalBuses = await prisma.bus.count();
    console.log(`🚌 Total buses: ${totalBuses}`);
    
  } catch (error) {
    console.error('❌ Error checking routes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoutes();