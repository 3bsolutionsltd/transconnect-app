#!/usr/bin/env node

/**
 * TransConnect Staging Setup - Quick Start Script
 * 
 * This script helps you set up the staging environment quickly
 * by guiding you through the necessary steps.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function exec(command, description) {
  try {
    log(`\n⚙️  ${description}...`, 'info');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} - Done!`, 'success');
    return true;
  } catch (error) {
    log(`❌ ${description} - Failed!`, 'error');
    return false;
  }
}

async function main() {
  console.clear();
  log('╔═══════════════════════════════════════════════════════╗', 'info');
  log('║   TransConnect Staging Environment Quick Setup       ║', 'info');
  log('╚═══════════════════════════════════════════════════════╝', 'info');
  log('\nThis script will guide you through setting up staging.\n', 'info');

  // Step 1: Check prerequisites
  log('📋 Checking prerequisites...', 'info');
  
  try {
    execSync('node --version', { stdio: 'pipe' });
    log('  ✓ Node.js installed', 'success');
  } catch {
    log('  ✗ Node.js not found!', 'error');
    process.exit(1);
  }

  try {
    execSync('npm --version', { stdio: 'pipe' });
    log('  ✓ npm installed', 'success');
  } catch {
    log('  ✗ npm not found!', 'error');
    process.exit(1);
  }

  // Step 2: Get database URL
  log('\n📊 Database Setup', 'info');
  log('You need a PostgreSQL database URL from Render.', 'warning');
  log('Format: postgresql://user:password@host:port/database\n', 'warning');
  
  const hasDatabase = await question('Do you have a Render database created? (y/n): ');
  
  if (hasDatabase.toLowerCase() !== 'y') {
    log('\n📖 Please follow these steps:', 'warning');
    log('1. Go to https://dashboard.render.com/', 'info');
    log('2. Click "New +" → "PostgreSQL"', 'info');
    log('3. Name: transconnect-staging-db', 'info');
    log('4. Select a plan (Starter $7/month recommended)', 'info');
    log('5. Copy the "External Database URL"', 'info');
    log('6. Run this script again\n', 'info');
    process.exit(0);
  }

  const databaseUrl = await question('\nPaste your DATABASE_URL: ');
  
  if (!databaseUrl || !databaseUrl.startsWith('postgresql://')) {
    log('Invalid database URL!', 'error');
    process.exit(1);
  }

  // Set environment variable
  process.env.DATABASE_URL = databaseUrl;
  
  // Step 3: Navigate to backend directory
  const backendPath = path.join(__dirname, 'transconnect-backend');
  
  if (!fs.existsSync(backendPath)) {
    log('Backend directory not found!', 'error');
    process.exit(1);
  }

  process.chdir(backendPath);
  log('✓ Navigated to backend directory', 'success');

  // Step 4: Install dependencies
  log('\n📦 Installing Dependencies', 'info');
  const installDeps = await question('Install dependencies? (y/n): ');
  
  if (installDeps.toLowerCase() === 'y') {
    if (!exec('npm install', 'Installing npm packages')) {
      process.exit(1);
    }
    if (!exec('npm install --save-dev @faker-js/faker', 'Installing faker for test data')) {
      process.exit(1);
    }
  }

  // Step 5: Run migrations
  log('\n🔄 Database Migrations', 'info');
  const runMigrations = await question('Run Prisma migrations? (y/n): ');
  
  if (runMigrations.toLowerCase() === 'y') {
    if (!exec(`$env:DATABASE_URL="${databaseUrl}"; npx prisma migrate deploy`, 'Running migrations')) {
      process.exit(1);
    }
    if (!exec('npx prisma generate', 'Generating Prisma client')) {
      process.exit(1);
    }
  }

  // Step 6: Seed test data
  log('\n🌱 Seed Test Data', 'info');
  log('This will create:', 'warning');
  log('  • 10 operators with buses', 'info');
  log('  • 500+ routes with segments', 'info');
  log('  • 30 days of schedules', 'info');
  log('  • 150 test users', 'info');
  log('  • 1000+ bookings', 'info');
  
  const seedData = await question('\nSeed test data? (y/n): ');
  
  if (seedData.toLowerCase() === 'y') {
    if (!exec(`$env:DATABASE_URL="${databaseUrl}"; node scripts/seed-staging-data.js`, 'Seeding test data')) {
      log('\n⚠️  Seeding failed. Check the error above.', 'warning');
    }
  }

  // Step 7: Next steps
  log('\n\n╔═══════════════════════════════════════════════════════╗', 'success');
  log('║              Setup Complete! 🎉                       ║', 'success');
  log('╚═══════════════════════════════════════════════════════╝', 'success');
  
  log('\n📝 Next Steps:', 'info');
  log('1. Deploy backend to Render:', 'info');
  log('   • Go to https://dashboard.render.com/', 'info');
  log('   • Create Web Service from GitHub', 'info');
  log('   • Set environment variables (see .env.staging.example)', 'info');
  log('', 'info');
  log('2. Test the API:', 'info');
  log('   • Health check: https://your-backend.onrender.com/api/health', 'info');
  log('   • Login: POST /api/auth/login', 'info');
  log('     Email: admin@transconnect-staging.com', 'info');
  log('     Password: password123', 'info');
  log('', 'info');
  log('3. Build staging mobile app:', 'info');
  log('   cd ../transconnect-mobile', 'info');
  log('   npx eas-cli build --platform android --profile staging', 'info');
  log('', 'info');
  log('📖 Full documentation: STAGING_ENVIRONMENT_SETUP.md', 'info');
  log('✅ Checklist: STAGING_DEPLOYMENT_CHECKLIST.md', 'info');
  
  rl.close();
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
