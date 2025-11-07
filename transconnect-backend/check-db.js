const { PrismaClient } = require('@prisma/client');

async function checkProductionDatabase() {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Checking Production Database...');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Count routes
    const routeCount = await prisma.route.count();
    console.log(`📊 Total Routes: ${routeCount}`);

    // Count active routes  
    const activeRoutes = await prisma.route.count({
      where: { active: true }
    });
    console.log(`✅ Active Routes: ${activeRoutes}`);

    // Get sample routes with includes
    const sampleRoutes = await prisma.route.findMany({
      where: { active: true },
      take: 3,
      include: {
        operator: {
          select: {
            id: true,
            companyName: true,
            approved: true
          }
        },
        bus: {
          select: {
            id: true,
            plateNumber: true,
            model: true,
            capacity: true
          }
        }
      }
    });

    console.log(`📋 Sample Routes (${sampleRoutes.length}):`);
    sampleRoutes.forEach((route, index) => {
      console.log(`  ${index + 1}. ${route.origin} → ${route.destination}`);
      console.log(`     Price: UGX ${route.price}, Distance: ${route.distance}km`);
      console.log(`     Operator: ${route.operator.companyName} (Approved: ${route.operator.approved})`);
      console.log(`     Bus: ${route.bus.plateNumber} (${route.bus.capacity} seats)`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.error('Full Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionDatabase();