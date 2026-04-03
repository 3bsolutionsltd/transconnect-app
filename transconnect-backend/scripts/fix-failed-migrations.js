/**
 * Fix Failed Prisma Migrations
 * Marks failed migrations as rolled back so they can be reapplied
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFailedMigrations() {
  try {
    console.log('🔍 Checking for failed migrations...');
    
    // Query the _prisma_migrations table
    const failedMigrations = await prisma.$queryRaw`
      SELECT migration_name, started_at, finished_at 
      FROM _prisma_migrations 
      WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
    `;
    
    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      return;
    }
    
    console.log(`⚠️ Found ${failedMigrations.length} failed migration(s):`);
    failedMigrations.forEach(m => {
      console.log(`   - ${m.migration_name}`);
    });
    
    // Mark each failed migration as rolled back
    for (const migration of failedMigrations) {
      console.log(`🔄 Marking ${migration.migration_name} as rolled back...`);
      
      await prisma.$executeRaw`
        UPDATE _prisma_migrations 
        SET rolled_back_at = NOW(), finished_at = NOW()
        WHERE migration_name = ${migration.migration_name}
      `;
      
      console.log(`✅ Marked ${migration.migration_name} as rolled back`);
    }
    
    console.log('✅ All failed migrations have been marked as rolled back');
    console.log('💡 Prisma migrate deploy will now be able to proceed');
    
  } catch (error) {
    console.error('❌ Error fixing migrations:', error.message);
    // Don't throw - let the deploy continue
  } finally {
    await prisma.$disconnect();
  }
}

fixFailedMigrations();
