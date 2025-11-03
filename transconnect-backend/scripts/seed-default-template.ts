import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating default notification template...');

  try {
    // Create a default template that we can use
    await prisma.notificationTemplate.upsert({
      where: { name: 'default' },
      update: {},
      create: {
        name: 'default',
        type: 'GENERAL',
        channel: ['EMAIL', 'PUSH', 'IN_APP'],
        title: 'Notification',
        body: 'You have a new notification',
        isActive: true,
      },
    });

    console.log('✅ Default notification template created successfully!');
  } catch (error) {
    console.error('❌ Error creating default template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });