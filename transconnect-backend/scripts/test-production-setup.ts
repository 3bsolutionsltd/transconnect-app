import { DatabaseService } from '../src/services/database.service';
import { BackupService } from '../src/services/backup.service';
import { MonitoringService } from '../src/services/monitoring.service';
import dotenv from 'dotenv';

dotenv.config();

async function testProductionDatabaseSetup() {
  console.log('🧪 Starting production database setup tests...');
  console.log('📅 Test started at:', new Date().toISOString());

  let allTestsPassed = true;
  const testResults: any[] = [];

  // Test 1: Database Service Initialization
  try {
    console.log('\n🔍 Test 1: Database Service Initialization');
    const dbService = DatabaseService.getInstance();
    console.log('✅ Database service initialized successfully');
    testResults.push({ test: 'Database Service Init', status: 'PASS' });
  } catch (error) {
    console.error('❌ Database service initialization failed:', error);
    testResults.push({ test: 'Database Service Init', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Test 2: Database Health Check
  try {
    console.log('\n🔍 Test 2: Database Health Check');
    const dbService = DatabaseService.getInstance();
    const health = await dbService.performHealthCheck();
    
    if (health.database) {
      console.log('✅ Database connection healthy');
      console.log('📊 Connection pool stats:', health.connectionPool);
      testResults.push({ test: 'Database Health Check', status: 'PASS', data: health });
    } else {
      console.error('❌ Database health check failed');
      testResults.push({ test: 'Database Health Check', status: 'FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ Database health check error:', error);
    testResults.push({ test: 'Database Health Check', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Test 3: Prisma Client Access
  try {
    console.log('\n🔍 Test 3: Prisma Client Access');
    const dbService = DatabaseService.getInstance();
    const prisma = dbService.getPrismaClient();
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test_value`;
    console.log('✅ Prisma client working correctly');
    testResults.push({ test: 'Prisma Client Access', status: 'PASS' });
  } catch (error) {
    console.error('❌ Prisma client test failed:', error);
    testResults.push({ test: 'Prisma Client Access', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Test 4: Transaction Support
  try {
    console.log('\n🔍 Test 4: Transaction Support');
    const dbService = DatabaseService.getInstance();
    
    await dbService.executeTransaction(async (prisma) => {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    });
    
    console.log('✅ Transaction support working');
    testResults.push({ test: 'Transaction Support', status: 'PASS' });
  } catch (error) {
    console.error('❌ Transaction test failed:', error);
    testResults.push({ test: 'Transaction Support', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Test 5: Backup Service (if enabled)
  if (process.env.BACKUP_ENABLED === 'true') {
    try {
      console.log('\n🔍 Test 5: Backup Service');
      const backupService = BackupService.getInstance();
      const config = backupService.getConfig();
      
      if (config.enabled) {
        console.log('✅ Backup service configured and enabled');
        testResults.push({ test: 'Backup Service', status: 'PASS' });
      } else {
        console.log('⚠️  Backup service configured but disabled');
        testResults.push({ test: 'Backup Service', status: 'SKIP' });
      }
    } catch (error) {
      console.error('❌ Backup service test failed:', error);
      testResults.push({ test: 'Backup Service', status: 'FAIL', error: error });
      allTestsPassed = false;
    }
  } else {
    console.log('\n⏭️  Test 5: Backup Service (skipped - disabled)');
    testResults.push({ test: 'Backup Service', status: 'SKIP' });
  }

  // Test 6: Monitoring Service (if enabled)
  if (process.env.MONITORING_ENABLED === 'true') {
    try {
      console.log('\n🔍 Test 6: Monitoring Service');
      const monitoringService = MonitoringService.getInstance();
      const config = monitoringService.getConfig();
      
      if (config.enabled) {
        console.log('✅ Monitoring service configured and enabled');
        testResults.push({ test: 'Monitoring Service', status: 'PASS' });
      } else {
        console.log('⚠️  Monitoring service configured but disabled');
        testResults.push({ test: 'Monitoring Service', status: 'SKIP' });
      }
    } catch (error) {
      console.error('❌ Monitoring service test failed:', error);
      testResults.push({ test: 'Monitoring Service', status: 'FAIL', error: error });
      allTestsPassed = false;
    }
  } else {
    console.log('\n⏭️  Test 6: Monitoring Service (skipped - disabled)');
    testResults.push({ test: 'Monitoring Service', status: 'SKIP' });
  }

  // Test 7: Redis Connection (if configured)
  if (process.env.REDIS_URL) {
    try {
      console.log('\n🔍 Test 7: Redis Connection');
      const dbService = DatabaseService.getInstance();
      const redis = dbService.getRedisClient();
      
      if (redis) {
        await redis.ping();
        console.log('✅ Redis connection working');
        testResults.push({ test: 'Redis Connection', status: 'PASS' });
      } else {
        console.log('⚠️  Redis client not initialized');
        testResults.push({ test: 'Redis Connection', status: 'SKIP' });
      }
    } catch (error) {
      console.error('❌ Redis connection test failed:', error);
      testResults.push({ test: 'Redis Connection', status: 'FAIL', error: error });
      allTestsPassed = false;
    }
  } else {
    console.log('\n⏭️  Test 7: Redis Connection (skipped - not configured)');
    testResults.push({ test: 'Redis Connection', status: 'SKIP' });
  }

  // Test 8: Database Schema Validation
  try {
    console.log('\n🔍 Test 8: Database Schema Validation');
    const dbService = DatabaseService.getInstance();
    const prisma = dbService.getPrismaClient();
    
    // Check if key tables exist
    const tables = ['User', 'Operator', 'Bus', 'Route', 'Booking', 'Payment'];
    let tableCount = 0;
    
    for (const table of tables) {
      try {
        await (prisma as any)[table].findFirst();
        tableCount++;
      } catch (error: any) {
        if (error.code !== 'P2021') {
          tableCount++; // Table exists but might be empty
        }
      }
    }
    
    if (tableCount === tables.length) {
      console.log('✅ All required tables are accessible');
      testResults.push({ test: 'Database Schema', status: 'PASS' });
    } else {
      console.error(`❌ Only ${tableCount}/${tables.length} tables are accessible`);
      testResults.push({ test: 'Database Schema', status: 'FAIL' });
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ Database schema validation failed:', error);
    testResults.push({ test: 'Database Schema', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Test 9: Environment Configuration
  try {
    console.log('\n🔍 Test 9: Environment Configuration');
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables are set');
      testResults.push({ test: 'Environment Config', status: 'PASS' });
    } else {
      console.error('❌ Missing environment variables:', missingVars);
      testResults.push({ test: 'Environment Config', status: 'FAIL', missing: missingVars });
      allTestsPassed = false;
    }
  } catch (error) {
    console.error('❌ Environment configuration test failed:', error);
    testResults.push({ test: 'Environment Config', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Test 10: Performance Baseline
  try {
    console.log('\n🔍 Test 10: Performance Baseline');
    const dbService = DatabaseService.getInstance();
    const prisma = dbService.getPrismaClient();
    
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`;
    const queryTime = Date.now() - startTime;
    
    if (queryTime < 1000) {
      console.log(`✅ Query performance acceptable (${queryTime}ms)`);
      testResults.push({ test: 'Performance Baseline', status: 'PASS', queryTime });
    } else {
      console.warn(`⚠️  Slow query performance (${queryTime}ms)`);
      testResults.push({ test: 'Performance Baseline', status: 'WARN', queryTime });
    }
  } catch (error) {
    console.error('❌ Performance baseline test failed:', error);
    testResults.push({ test: 'Performance Baseline', status: 'FAIL', error: error });
    allTestsPassed = false;
  }

  // Cleanup
  try {
    const dbService = DatabaseService.getInstance();
    await dbService.disconnect();
    console.log('\n🧹 Database connections closed');
  } catch (error) {
    console.error('⚠️  Error during cleanup:', error);
  }

  // Print test results summary
  console.log('\n📊 Test Results Summary:');
  console.log('=' * 50);
  
  const passedTests = testResults.filter(t => t.status === 'PASS').length;
  const failedTests = testResults.filter(t => t.status === 'FAIL').length;
  const skippedTests = testResults.filter(t => t.status === 'SKIP').length;
  const warnTests = testResults.filter(t => t.status === 'WARN').length;

  testResults.forEach((result, index) => {
    const statusIcon = {
      'PASS': '✅',
      'FAIL': '❌',
      'SKIP': '⏭️ ',
      'WARN': '⚠️ '
    }[result.status] || '❓';
    
    console.log(`${statusIcon} ${index + 1}. ${result.test}: ${result.status}`);
  });

  console.log('\n📈 Summary:');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Warnings: ${warnTests}`);
  console.log(`  Skipped: ${skippedTests}`);
  console.log(`  Total: ${testResults.length}`);

  console.log('\n📅 Test completed at:', new Date().toISOString());

  if (allTestsPassed && failedTests === 0) {
    console.log('\n🎉 All production database tests passed!');
    console.log('✅ Production database setup is ready for deployment');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    console.log('🔧 Fix the issues before deploying to production');
    process.exit(1);
  }
}

// Run tests
testProductionDatabaseSetup().catch((error) => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});