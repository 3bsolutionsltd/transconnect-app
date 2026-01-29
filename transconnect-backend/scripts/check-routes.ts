import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRoutes() {
  console.log('🔍 Checking routes in database...\n');

  const routes = await prisma.route.findMany({
    include: {
      operator: {
        select: {
          companyName: true
        }
      },
      segments: true
    }
  });

  console.log(`📊 Total routes: ${routes.length}\n`);

  routes.forEach((route, index) => {
    console.log(`${index + 1}. Route ID: ${route.id}`);
    console.log(`   ${route.origin} → ${route.destination}`);
    console.log(`   Via: ${route.via || 'None'}`);
    console.log(`   Operator: ${route.operator.companyName}`);
    console.log(`   Segment Enabled: ${route.segmentEnabled}`);
    console.log(`   Existing Segments: ${route.segments.length}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkRoutes();
