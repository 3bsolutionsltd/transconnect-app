import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT version() as db_version`;
    console.log('✅ Database query successful');
    console.log('📊 Database info:', result);

    // Test all main tables exist
    const tables = [
      'User',
      'Operator',
      'Bus',
      'Route',
      'Booking',
      'Payment',
      'Ride',
      'QRTicket',
      'NotificationTemplate',
      'Notification',
    ];

    console.log('\n🔍 Checking table existence...');
    for (const table of tables) {
      try {
        await (prisma as any)[table].findFirst();
        console.log(`✅ Table ${table} exists and accessible`);
      } catch (error: any) {
        if (error.code === 'P2021') {
          console.log(`❌ Table ${table} does not exist`);
        } else {
          console.log(`✅ Table ${table} exists (empty or restricted)`);
        }
      }
    }

    // Test connection pool
    console.log('\n🔍 Testing connection pool...');
    const connections = await prisma.$queryRaw`
      SELECT count(*) as active_connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    console.log('📊 Active connections:', connections);

    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();