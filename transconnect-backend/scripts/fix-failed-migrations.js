/**
 * Clean up failed migration entries from production database
 * Removes incompatible migration attempts from _prisma_migrations table
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupFailedMigrations() {
  try {
    console.log('🧹 Cleaning up failed migration entries...');
    
    // Migrations that were deleted because they tried to alter non-existent tables
    const deletedMigrations = [
      '20260128155514_add_segment_enabled_to_routes',
      '20260128155900_add_segment_enabled',
      '20260128162500_add_missing_route_columns'
    ];
    
    for (const migrationName of deletedMigrations) {
      console.log(`🗑️ Removing ${migrationName} from tracking table...`);
      
      await prisma.$executeRaw`
        DELETE FROM _prisma_migrations 
        WHERE migration_name = ${migrationName}
      `;
      
      console.log(`✅ Removed ${migrationName}`);
    }
    
    console.log('✅ Migration cleanup complete');
    console.log('💡 Prisma migrate deploy can now proceed with clean state');
    
  } catch (error) {
    console.error('❌ Error cleaning migrations:', error.message);
    // Don't throw - let the deploy continue
  } finally {
    await prisma.$disconnect();
  }
}

cleanupFailedMigrations();
