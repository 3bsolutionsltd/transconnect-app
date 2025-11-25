// Create test admin user for login testing
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    console.log('🔧 Creating test admin user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@transconnect.ug' },
      update: {
        password: hashedPassword,
        role: 'ADMIN'
      },
      create: {
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@transconnect.ug',
        phone: '+256700000000',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Test admin user created/updated:');
    console.log('   Email: admin@transconnect.ug');
    console.log('   Password: admin123');
    console.log('   Role: ADMIN');
    console.log('\n🎯 You can now login to the admin panel!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();