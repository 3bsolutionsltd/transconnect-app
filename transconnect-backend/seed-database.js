const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSampleData() {
  console.log('🚀 Creating sample data for TransConnect...\n');

  try {
    // 1. Create sample operators
    console.log('📝 Creating sample operators...');
    
    const operatorUser1 = await prisma.user.create({
      data: {
        email: 'swift@buslines.com',
        password: await bcrypt.hash('swift123', 12),
        firstName: 'Swift',
        lastName: 'Manager',
        phone: '+256700001001',
        role: 'OPERATOR',
        verified: true
      }
    });

    const operatorUser2 = await prisma.user.create({
      data: {
        email: 'pioneer@transport.com',
        password: await bcrypt.hash('pioneer123', 12),
        firstName: 'Pioneer',
        lastName: 'Admin',
        phone: '+256700001002',
        role: 'OPERATOR',
        verified: true
      }
    });

    const operator1 = await prisma.operator.create({
      data: {
        companyName: 'Swift Bus Lines',
        license: 'SBL-2024-001',
        approved: true,
        userId: operatorUser1.id
      }
    });

    const operator2 = await prisma.operator.create({
      data: {
        companyName: 'Pioneer Easy Bus',
        license: 'PEB-2024-002',
        approved: true,
        userId: operatorUser2.id
      }
    });

    console.log('✅ Created 2 operators');

    // 2. Create sample buses
    console.log('📝 Creating sample buses...');
    
    const bus1 = await prisma.bus.create({
      data: {
        plateNumber: 'UBB 123A',
        model: 'Toyota Coaster',
        capacity: 28,
        amenities: ['AC', 'WiFi', 'Music'],
        operatorId: operator1.id,
        active: true
      }
    });

    const bus2 = await prisma.bus.create({
      data: {
        plateNumber: 'UBJ 456B',
        model: 'Isuzu NPR',
        capacity: 30,
        amenities: ['AC', 'Charging Ports'],
        operatorId: operator1.id,
        active: true
      }
    });

    const bus3 = await prisma.bus.create({
      data: {
        plateNumber: 'UAG 789C',
        model: 'Mercedes Sprinter',
        capacity: 22,
        amenities: ['AC', 'WiFi', 'TV'],
        operatorId: operator2.id,
        active: true
      }
    });

    const bus4 = await prisma.bus.create({
      data: {
        plateNumber: 'UBA 012D',
        model: 'Toyota Hiace',
        capacity: 14,
        amenities: ['AC'],
        operatorId: operator2.id,
        active: true
      }
    });

    console.log('✅ Created 4 buses');

    // 3. Create sample routes
    console.log('📝 Creating sample routes...');
    
    const routes = [
      // Swift Bus Lines routes
      {
        origin: 'Kampala',
        destination: 'Jinja',
        distance: 85.0,
        duration: 120, // 2 hours
        price: 15000.0,
        departureTime: '08:00',
        operatorId: operator1.id,
        busId: bus1.id
      },
      {
        origin: 'Kampala',
        destination: 'Jinja',
        distance: 85.0,
        duration: 120,
        price: 15000.0,
        departureTime: '14:00',
        operatorId: operator1.id,
        busId: bus2.id
      },
      {
        origin: 'Jinja',
        destination: 'Kampala',
        distance: 85.0,
        duration: 120,
        price: 15000.0,
        departureTime: '07:00',
        operatorId: operator1.id,
        busId: bus1.id
      },
      {
        origin: 'Jinja',
        destination: 'Kampala',
        distance: 85.0,
        duration: 120,
        price: 15000.0,
        departureTime: '16:00',
        operatorId: operator1.id,
        busId: bus2.id
      },
      
      // Pioneer Easy Bus routes
      {
        origin: 'Kampala',
        destination: 'Mbale',
        distance: 245.0,
        duration: 300, // 5 hours
        price: 35000.0,
        departureTime: '06:00',
        operatorId: operator2.id,
        busId: bus3.id
      },
      {
        origin: 'Kampala',
        destination: 'Mbale',
        distance: 245.0,
        duration: 300,
        price: 35000.0,
        departureTime: '13:00',
        operatorId: operator2.id,
        busId: bus4.id
      },
      {
        origin: 'Mbale',
        destination: 'Kampala',
        distance: 245.0,
        duration: 300,
        price: 35000.0,
        departureTime: '06:30',
        operatorId: operator2.id,
        busId: bus3.id
      },
      {
        origin: 'Kampala',
        destination: 'Entebbe',
        distance: 42.0,
        duration: 60, // 1 hour
        price: 8000.0,
        departureTime: '09:00',
        operatorId: operator2.id,
        busId: bus4.id
      },
      {
        origin: 'Entebbe',
        destination: 'Kampala',
        distance: 42.0,
        duration: 60,
        price: 8000.0,
        departureTime: '17:00',
        operatorId: operator2.id,
        busId: bus4.id
      }
    ];

    for (const routeData of routes) {
      await prisma.route.create({
        data: routeData
      });
    }

    console.log('✅ Created 9 routes');

    // 4. Create a sample passenger user
    console.log('📝 Creating sample passenger...');
    
    const passenger = await prisma.user.create({
      data: {
        email: 'passenger@example.com',
        password: await bcrypt.hash('passenger123', 12),
        firstName: 'John',
        lastName: 'Passenger',
        phone: '+256700002001',
        role: 'PASSENGER',
        verified: true
      }
    });

    console.log('✅ Created sample passenger');

    // 5. Create admin user
    console.log('📝 Creating admin user...');
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@transconnect.com',
        password: await bcrypt.hash('admin123', 12),
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+256700000001',
        role: 'ADMIN',
        verified: true
      }
    });

    console.log('✅ Created admin user');

    console.log('\n🎉 Sample data creation completed!');
    console.log('\n📊 Summary:');
    console.log('- 2 Bus Operators (Swift Bus Lines, Pioneer Easy Bus)');
    console.log('- 4 Buses (varying capacities and amenities)');
    console.log('- 9 Routes (Kampala-Jinja, Kampala-Mbale, Kampala-Entebbe)');
    console.log('- 1 Sample Passenger');
    console.log('- 1 Admin User');

    console.log('\n🔐 Test Credentials:');
    console.log('Admin: admin@transconnect.com / admin123');
    console.log('Operator 1: swift@buslines.com / swift123');
    console.log('Operator 2: pioneer@transport.com / pioneer123');
    console.log('Passenger: passenger@example.com / passenger123');

    console.log('\n🚀 You can now test the booking flow:');
    console.log('1. Register/Login as passenger');
    console.log('2. Search for routes (e.g., Kampala to Jinja)');
    console.log('3. Select seats and create bookings');
    console.log('4. Process payments');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // Delete in reverse order of dependencies
    await prisma.verification.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.ride.deleteMany();
    await prisma.route.deleteMany();
    await prisma.bus.deleteMany();
    await prisma.operator.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

async function main() {
  try {
    await clearExistingData();
    await createSampleData();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

main();