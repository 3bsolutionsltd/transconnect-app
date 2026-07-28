/**
 * Seed script to add operator portal configuration to existing operators
 * Run with: npx ts-node prisma/seed-operator-portals.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding operator portal data...');

  // Get all operators
  const operators = await prisma.operator.findMany({
    select: {
      id: true,
      companyName: true,
      slug: true,
      portalEnabled: true
    }
  });

  console.log(`Found ${operators.length} operators`);

  // Sample portal configurations
  const portalConfigs = [
    {
      slug: 'swift-transport',
      brandLogoUrl: 'https://via.placeholder.com/200x80/FF5722/FFFFFF?text=Swift+Transport',
      brandColor: '#FF5722',
      tagline: 'Your Swift and Reliable Travel Partner',
      description: 'Swift Transport has been serving Uganda for over 10 years with comfortable buses and punctual service. We connect major cities with daily departures.',
      portalEnabled: true
    },
    {
      slug: 'gateway-bus',
      brandLogoUrl: 'https://via.placeholder.com/200x80/2196F3/FFFFFF?text=Gateway+Bus',
      brandColor: '#2196F3',
      tagline: 'Connecting Uganda, One Journey at a Time',
      description: 'Gateway Bus Services offers premium intercity travel with modern fleet and professional drivers. Experience comfort and safety on every trip.',
      portalEnabled: true
    },
    {
      slug: 'pearl-express',
      brandLogoUrl: 'https://via.placeholder.com/200x80/4CAF50/FFFFFF?text=Pearl+Express',
      brandColor: '#4CAF50',
      tagline: 'The Pearl of Ugandan Transport',
      description: 'Pearl Express combines affordability with quality service. Our extensive network covers all major routes across Uganda.',
      portalEnabled: true
    }
  ];

  // Update operators with portal configuration
  let updatedCount = 0;
  for (let i = 0; i < Math.min(operators.length, portalConfigs.length); i++) {
    const operator = operators[i];
    const config = portalConfigs[i];

    // Skip if already has a slug
    if (operator.slug) {
      console.log(`  ⏭️  Skipping ${operator.companyName} - already has slug: ${operator.slug}`);
      continue;
    }

    try {
      await prisma.operator.update({
        where: { id: operator.id },
        data: {
          slug: config.slug,
          brandLogoUrl: config.brandLogoUrl,
          brandColor: config.brandColor,
          tagline: config.tagline,
          description: config.description,
          portalEnabled: config.portalEnabled
        }
      });

      console.log(`  ✅ Updated ${operator.companyName} with slug: ${config.slug}`);
      updatedCount++;
    } catch (error: any) {
      console.error(`  ❌ Failed to update ${operator.companyName}:`, error.message);
    }
  }

  console.log(`\n✅ Operator portal seeding complete!`);
  console.log(`   Updated: ${updatedCount} operators`);
  console.log(`   Skipped: ${operators.length - updatedCount} operators\n`);

  // Display portal URLs
  const enabledPortals = await prisma.operator.findMany({
    where: {
      portalEnabled: true,
      slug: { not: null }
    },
    select: {
      companyName: true,
      slug: true,
      tagline: true
    }
  });

  if (enabledPortals.length > 0) {
    console.log('🌐 Enabled Operator Portals:');
    enabledPortals.forEach(portal => {
      console.log(`   ${portal.companyName}`);
      console.log(`   └─ http://localhost:3000/operator/${portal.slug}`);
      console.log(`   └─ ${portal.tagline}\n`);
    });
  }
}

main()
  .catch((error) => {
    console.error('Error seeding operator portals:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
