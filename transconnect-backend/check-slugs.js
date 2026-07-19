const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOperatorSlugs() {
  try {
    console.log('Checking operator slugs in database...\n');
    
    const operators = await prisma.operator.findMany({
      select: {
        id: true,
        companyName: true,
        slug: true,
        portalEnabled: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (operators.length === 0) {
      console.log('No operators found in database.');
    } else {
      console.log(`Found ${operators.length} operator(s):\n`);
      operators.forEach((op, index) => {
        console.log(`${index + 1}. ${op.companyName}`);
        console.log(`   ID: ${op.id}`);
        console.log(`   Slug: ${op.slug || '(not set)'}`);
        console.log(`   Portal Enabled: ${op.portalEnabled}`);
        console.log(`   Updated At: ${op.updatedAt}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error checking slugs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOperatorSlugs();
