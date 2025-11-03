import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function optimizeDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Starting database optimization...');
    console.log('📅 Started at:', new Date().toISOString());

    // Update table statistics
    console.log('\n📊 Updating table statistics...');
    await prisma.$executeRaw`ANALYZE`;
    console.log('✅ Table statistics updated');

    // Vacuum database to reclaim space
    console.log('\n🧹 Vacuuming database...');
    await prisma.$executeRaw`VACUUM`;
    console.log('✅ Database vacuumed');

    // Get database size before optimization
    const sizeBefore = await prisma.$queryRaw<any[]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    console.log('📊 Database size:', sizeBefore[0]?.size);

    // Show table sizes
    console.log('\n📋 Table sizes:');
    const tableSizes = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename))) as size,
        pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(tablename)) as size_bytes
      FROM pg_stat_user_tables
      ORDER BY size_bytes DESC
    `;

    tableSizes.forEach((table: any) => {
      console.log(`  ${table.tablename}: ${table.size}`);
    });

    // Show index usage
    console.log('\n📋 Index usage statistics:');
    const indexStats = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scans,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan > 0
      ORDER BY idx_scan DESC
      LIMIT 10
    `;

    indexStats.forEach((index: any) => {
      console.log(`  ${index.indexname} (${index.tablename}): ${index.scans} scans, ${index.size}`);
    });

    // Check for unused indexes
    console.log('\n⚠️  Checking for unused indexes:');
    const unusedIndexes = await prisma.$queryRaw<any[]>`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
      AND indexname NOT LIKE '%_pkey'
      ORDER BY pg_relation_size(indexrelid) DESC
    `;

    if (unusedIndexes.length > 0) {
      console.log('  Found unused indexes:');
      unusedIndexes.forEach((index: any) => {
        console.log(`    ${index.indexname} (${index.tablename}): ${index.size}`);
      });
    } else {
      console.log('  ✅ No unused indexes found');
    }

    // Show slow queries
    console.log('\n🐌 Slow query analysis:');
    try {
      const slowQueries = await prisma.$queryRaw<any[]>`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          max_time
        FROM pg_stat_statements 
        WHERE calls > 10
        ORDER BY mean_time DESC 
        LIMIT 5
      `;

      if (slowQueries.length > 0) {
        slowQueries.forEach((query: any, index: number) => {
          console.log(`  ${index + 1}. Avg: ${Math.round(query.mean_time)}ms, Max: ${Math.round(query.max_time)}ms, Calls: ${query.calls}`);
          console.log(`     Query: ${query.query.substring(0, 100)}...`);
        });
      } else {
        console.log('  ✅ No slow queries found (pg_stat_statements may not be enabled)');
      }
    } catch (error) {
      console.log('  ⚠️  pg_stat_statements extension not available');
    }

    // Connection analysis
    console.log('\n🔗 Connection analysis:');
    const connectionStats = await prisma.$queryRaw<any[]>`
      SELECT 
        count(*) as total_connections,
        count(case when state = 'active' then 1 end) as active_connections,
        count(case when state = 'idle' then 1 end) as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    if (connectionStats.length > 0) {
      const stats = connectionStats[0];
      console.log(`  Total: ${stats.total_connections}, Active: ${stats.active_connections}, Idle: ${stats.idle_connections}`);
    }

    // Database configuration recommendations
    console.log('\n💡 Optimization recommendations:');
    
    const totalSize = tableSizes.reduce((sum, table) => sum + parseInt(table.size_bytes), 0);
    const sizeInMB = Math.round(totalSize / (1024 * 1024));
    
    if (sizeInMB > 1000) {
      console.log('  - Consider partitioning large tables');
      console.log('  - Implement regular VACUUM FULL for heavily updated tables');
    }
    
    if (unusedIndexes.length > 3) {
      console.log('  - Remove unused indexes to improve write performance');
    }
    
    console.log('  - Monitor query performance regularly');
    console.log('  - Consider connection pooling if not already implemented');
    console.log('  - Schedule regular ANALYZE operations');

    console.log('\n🎉 Database optimization completed successfully!');
    console.log('📅 Completed at:', new Date().toISOString());

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabase();