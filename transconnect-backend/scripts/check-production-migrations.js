/**
 * Check which migrations have been applied in production
 * Safe read-only query
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMigrations() {
  try {
    console.log('🔍 Checking production database migration status...\n');
    
    // Query the _prisma_migrations table
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name, 
        started_at, 
        finished_at,
        rolled_back_at,
        CASE 
          WHEN rolled_back_at IS NOT NULL THEN 'ROLLED_BACK'
          WHEN finished_at IS NULL THEN 'FAILED/IN_PROGRESS'
          ELSE 'APPLIED'
        END as status
      FROM _prisma_migrations 
      ORDER BY started_at ASC
    `;
    
    console.log(`📊 Found ${migrations.length} migrations:\n`);
    
    const applied = migrations.filter(m => m.status === 'APPLIED');
    const failed = migrations.filter(m => m.status === 'FAILED/IN_PROGRESS');
    const rolledBack = migrations.filter(m => m.status === 'ROLLED_BACK');
    
    console.log('✅ APPLIED:');
    applied.forEach(m => {
      console.log(`   - ${m.migration_name}`);
    });
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED/IN_PROGRESS:');
      failed.forEach(m => {
        console.log(`   - ${m.migration_name} (started: ${m.started_at})`);
      });
    }
    
    if (rolledBack.length > 0) {
      console.log('\n🔄 ROLLED_BACK:');
      rolledBack.forEach(m => {
        console.log(`   - ${m.migration_name}`);
      });
    }
    
    console.log(`\n📈 Summary: ${applied.length} applied, ${failed.length} failed, ${rolledBack.length} rolled back`);
    
    // Check if route_segments table exists
    console.log('\n🔍 Checking if route_segments table exists...');
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'route_segments'
      );
    `;
    
    const tableExists = tableCheck[0].exists;
    console.log(tableExists ? '✅ route_segments table EXISTS' : '❌ route_segments table DOES NOT EXIST');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
