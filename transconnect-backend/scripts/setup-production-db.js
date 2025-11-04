#!/usr/bin/env node

/**
 * Production Database Setup Script
 * 
 * This script sets up the production database on Render PostgreSQL
 * Run this after configuring DATABASE_URL in your environment
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🗄️  Setting up TransConnect Production Database...\n');

// Change to the backend directory
const backendDir = path.join(__dirname, '..');
process.chdir(backendDir);

try {
  console.log('📋 Step 1: Checking database connection...');
  execSync('npx prisma db pull --schema=./prisma/schema.prisma', { 
    stdio: 'inherit',
    cwd: backendDir 
  });
  
  console.log('\n🔄 Step 2: Deploying database schema...');
  execSync('npx prisma db push --schema=./prisma/schema.prisma', { 
    stdio: 'inherit',
    cwd: backendDir 
  });
  
  console.log('\n🔧 Step 3: Generating Prisma client...');
  execSync('npx prisma generate --schema=./prisma/schema.prisma', { 
    stdio: 'inherit',
    cwd: backendDir 
  });
  
  console.log('\n🌱 Step 4: Running database seed (optional)...');
  try {
    execSync('npx prisma db seed', { 
      stdio: 'inherit',
      cwd: backendDir 
    });
    console.log('✅ Seed data loaded successfully');
  } catch (seedError) {
    console.log('⚠️  Seed data not loaded (optional step)');
  }
  
  console.log('\n✅ Production database setup completed successfully!');
  console.log('\n📊 Database Status:');
  console.log('- Schema: ✅ Deployed');
  console.log('- Tables: ✅ Created');
  console.log('- Client: ✅ Generated');
  console.log('- Seed: ✅ Optional (check above)');
  
  console.log('\n🔗 Next Steps:');
  console.log('1. Restart your Render service to use the new database');
  console.log('2. Test API endpoints with the production database');
  console.log('3. Configure environment variables for other services');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Verify DATABASE_URL is correctly set in Render environment');
  console.log('2. Ensure PostgreSQL service is running');
  console.log('3. Check database credentials and permissions');
  console.log('4. Verify network connectivity to database');
  
  process.exit(1);
}