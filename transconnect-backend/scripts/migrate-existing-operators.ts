import { PrismaClient } from '@prisma/client';
import { getDefaultPermissionsByRole } from '../src/middleware/operator-permissions';

const prisma = new PrismaClient();

async function migrateExistingOperators() {
  try {
    console.log('Starting migration of existing operators to operator users...');

    // Get all existing operators
    const operators = await prisma.operator.findMany({
      include: {
        user: true
      }
    });

    console.log(`Found ${operators.length} existing operators`);

    for (const operator of operators) {
      // Check if operator user already exists
      const existingOperatorUser = await prisma.operatorUser.findUnique({
        where: { userId: operator.userId }
      });

      if (existingOperatorUser) {
        console.log(`Operator user already exists for ${operator.companyName}, skipping...`);
        continue;
      }

      // Create operator user with MANAGER role and full permissions
      const operatorUser = await prisma.operatorUser.create({
        data: {
          userId: operator.userId,
          operatorId: operator.id,
          role: 'MANAGER',
          permissions: getDefaultPermissionsByRole('MANAGER'),
          active: true
        }
      });

      console.log(`✅ Created operator user for ${operator.companyName} (${operator.user.firstName} ${operator.user.lastName})`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateExistingOperators();
}

export { migrateExistingOperators };