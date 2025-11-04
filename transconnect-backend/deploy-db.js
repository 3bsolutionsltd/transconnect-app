const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function deployDatabase() {
  try {
    console.log('🚀 Starting database deployment...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // Deploy migrations
    console.log('🗄️ Deploying database migrations...');
    await execAsync('npx prisma migrate deploy');
    console.log('✅ Database migrations deployed');
    
    // Seed database (optional, but good for initial data)
    console.log('🌱 Seeding database...');
    try {
      await execAsync('npx prisma db seed');
      console.log('✅ Database seeded');
    } catch (seedError) {
      console.log('⚠️ Database seeding failed (this is normal if no seed script exists):', seedError.message);
    }
    
    console.log('🎉 Database deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Database deployment failed:', error);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  deployDatabase();
}

module.exports = { deployDatabase };