const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('Creating admin user for staging...\n');

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@transconnect-staging.com' },
      update: {},
      create: {
        email: 'admin@transconnect-staging.com',
        phone: '+256700000001',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        verified: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('\nCredentials:');
    console.log('  Email: admin@transconnect-staging.com');
    console.log('  Password: password123');
    console.log('  Role: ADMIN\n');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
