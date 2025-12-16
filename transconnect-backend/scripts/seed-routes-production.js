/**
 * Quick Production Route Seeder
 * Run this script to add routes to production database
 * Command: node scripts/seed-routes-production.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting production route seeding...\n');

  try {
    // 1. Check/Create Operator
    console.log('📋 Step 1: Setting up operator...');
    
    // Create operator user if not exists
    const operatorPassword = await bcrypt.hash('operator123', 12);
    const operatorUser = await prisma.user.upsert({
      where: { email: 'operator@transconnect.ug' },
      update: {},
      create: {
        email: 'operator@transconnect.ug',
        password: operatorPassword,
        firstName: 'TransConnect',
        lastName: 'Operator',
        phone: '+256700111222',
        role: 'OPERATOR',
        verified: true
      }
    });
    console.log('✅ Operator user created/verified');

    // Create operator company
    const operator = await prisma.operator.upsert({
      where: { userId: operatorUser.id },
      update: { approved: true },
      create: {
        companyName: 'TransConnect Pilot Bus Company',
        license: 'TC-2025-001',
        approved: true,
        userId: operatorUser.id
      }
    });
    console.log('✅ Operator company created/verified\n');

    // 2. Create Buses
    console.log('📋 Step 2: Setting up buses...');
    
    const bus1 = await prisma.bus.upsert({
      where: { plateNumber: 'UAZ-001T' },
      update: { active: true, operatorId: operator.id },
      create: {
        plateNumber: 'UAZ-001T',
        model: 'Toyota Coaster',
        capacity: 45,
        amenities: JSON.stringify(['AC', 'WiFi', 'USB Charging', 'Reclining Seats']),
        operatorId: operator.id,
        active: true
      }
    });

    const bus2 = await prisma.bus.upsert({
      where: { plateNumber: 'UAZ-002T' },
      update: { active: true, operatorId: operator.id },
      create: {
        plateNumber: 'UAZ-002T',
        model: 'Isuzu NPR',
        capacity: 50,
        amenities: JSON.stringify(['AC', 'Entertainment System', 'USB Charging']),
        operatorId: operator.id,
        active: true
      }
    });

    const bus3 = await prisma.bus.upsert({
      where: { plateNumber: 'UAZ-003T' },
      update: { active: true, operatorId: operator.id },
      create: {
        plateNumber: 'UAZ-003T',
        model: 'Mercedes Benz Sprinter',
        capacity: 30,
        amenities: JSON.stringify(['AC', 'WiFi', 'Premium Seats', 'USB Charging']),
        operatorId: operator.id,
        active: true
      }
    });
    console.log('✅ 3 buses created/verified\n');

    // 3. Create Popular Routes
    console.log('📋 Step 3: Setting up routes...');
    
    const routesData = [
      // Kampala to Jinja (Popular route)
      {
        id: 'kampala-jinja-0800',
        origin: 'Kampala',
        destination: 'Jinja',
        via: 'Mukono, Lugazi',
        distance: 85.0,
        duration: 150, // 2.5 hours
        price: 15000,
        departureTime: '08:00',
        busId: bus1.id,
        operatorId: operator.id
      },
      {
        id: 'kampala-jinja-1400',
        origin: 'Kampala',
        destination: 'Jinja',
        via: 'Mukono, Lugazi',
        distance: 85.0,
        duration: 150,
        price: 15000,
        departureTime: '14:00',
        busId: bus2.id,
        operatorId: operator.id
      },
      
      // Jinja to Kampala (Return route)
      {
        id: 'jinja-kampala-0700',
        origin: 'Jinja',
        destination: 'Kampala',
        via: 'Lugazi, Mukono',
        distance: 85.0,
        duration: 165, // 2.75 hours (accounting for traffic)
        price: 15000,
        departureTime: '07:00',
        busId: bus1.id,
        operatorId: operator.id
      },
      {
        id: 'jinja-kampala-1700',
        origin: 'Jinja',
        destination: 'Kampala',
        via: 'Lugazi, Mukono',
        distance: 85.0,
        duration: 165,
        price: 15000,
        departureTime: '17:00',
        busId: bus2.id,
        operatorId: operator.id
      },

      // Kampala to Mbarara
      {
        id: 'kampala-mbarara-0900',
        origin: 'Kampala',
        destination: 'Mbarara',
        via: 'Masaka, Lyantonde',
        distance: 266.0,
        duration: 255, // 4.25 hours
        price: 25000,
        departureTime: '09:00',
        busId: bus2.id,
        operatorId: operator.id
      },
      {
        id: 'kampala-mbarara-1500',
        origin: 'Kampala',
        destination: 'Mbarara',
        via: 'Masaka, Lyantonde',
        distance: 266.0,
        duration: 255,
        price: 25000,
        departureTime: '15:00',
        busId: bus1.id,
        operatorId: operator.id
      },

      // Mbarara to Kampala
      {
        id: 'mbarara-kampala-0700',
        origin: 'Mbarara',
        destination: 'Kampala',
        via: 'Lyantonde, Masaka',
        distance: 266.0,
        duration: 270,
        price: 25000,
        departureTime: '07:00',
        busId: bus2.id,
        operatorId: operator.id
      },

      // Entebbe to Kampala
      {
        id: 'entebbe-kampala-0730',
        origin: 'Entebbe',
        destination: 'Kampala',
        via: 'Expressway',
        distance: 41.0,
        duration: 60, // 1 hour via expressway
        price: 10000,
        departureTime: '07:30',
        busId: bus3.id,
        operatorId: operator.id
      },
      {
        id: 'entebbe-kampala-1200',
        origin: 'Entebbe',
        destination: 'Kampala',
        via: 'Expressway',
        distance: 41.0,
        duration: 60,
        price: 10000,
        departureTime: '12:00',
        busId: bus3.id,
        operatorId: operator.id
      },
      {
        id: 'entebbe-kampala-1800',
        origin: 'Entebbe',
        destination: 'Kampala',
        via: 'Expressway',
        distance: 41.0,
        duration: 60,
        price: 10000,
        departureTime: '18:00',
        busId: bus3.id,
        operatorId: operator.id
      },

      // Kampala to Entebbe
      {
        id: 'kampala-entebbe-0630',
        origin: 'Kampala',
        destination: 'Entebbe',
        via: 'Expressway',
        distance: 41.0,
        duration: 60,
        price: 10000,
        departureTime: '06:30',
        busId: bus3.id,
        operatorId: operator.id
      },
      {
        id: 'kampala-entebbe-1100',
        origin: 'Kampala',
        destination: 'Entebbe',
        via: 'Expressway',
        distance: 41.0,
        duration: 60,
        price: 10000,
        departureTime: '11:00',
        busId: bus3.id,
        operatorId: operator.id
      },
      {
        id: 'kampala-entebbe-1700',
        origin: 'Kampala',
        destination: 'Entebbe',
        via: 'Expressway',
        distance: 41.0,
        duration: 60,
        price: 10000,
        departureTime: '17:00',
        busId: bus3.id,
        operatorId: operator.id
      },

      // Kampala to Gulu
      {
        id: 'kampala-gulu-0800',
        origin: 'Kampala',
        destination: 'Gulu',
        via: 'Luweero, Karuma',
        distance: 333.0,
        duration: 330, // 5.5 hours
        price: 35000,
        departureTime: '08:00',
        busId: bus2.id,
        operatorId: operator.id
      },

      // Gulu to Kampala
      {
        id: 'gulu-kampala-0700',
        origin: 'Gulu',
        destination: 'Kampala',
        via: 'Karuma, Luweero',
        distance: 333.0,
        duration: 330,
        price: 35000,
        departureTime: '07:00',
        busId: bus2.id,
        operatorId: operator.id
      },

      // Kampala to Fort Portal
      {
        id: 'kampala-fortportal-0900',
        origin: 'Kampala',
        destination: 'Fort Portal',
        via: 'Mityana, Mubende',
        distance: 300.0,
        duration: 300, // 5 hours
        price: 30000,
        departureTime: '09:00',
        busId: bus1.id,
        operatorId: operator.id
      },

      // Fort Portal to Kampala
      {
        id: 'fortportal-kampala-0730',
        origin: 'Fort Portal',
        destination: 'Kampala',
        via: 'Mubende, Mityana',
        distance: 300.0,
        duration: 300,
        price: 30000,
        departureTime: '07:30',
        busId: bus1.id,
        operatorId: operator.id
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const routeData of routesData) {
      try {
        const existing = await prisma.route.findUnique({
          where: { id: routeData.id }
        });

        if (existing) {
          await prisma.route.update({
            where: { id: routeData.id },
            data: { ...routeData, active: true }
          });
          updatedCount++;
        } else {
          await prisma.route.create({
            data: { ...routeData, active: true }
          });
          createdCount++;
        }
      } catch (error) {
        console.log(`⚠️  Error with route ${routeData.id}:`, error.message);
      }
    }

    console.log(`✅ Routes processed: ${createdCount} created, ${updatedCount} updated\n`);

    // 4. Verify the routes
    console.log('📋 Step 4: Verifying routes...');
    const totalRoutes = await prisma.route.count();
    const activeRoutes = await prisma.route.count({ where: { active: true } });
    
    console.log(`✅ Total routes in database: ${totalRoutes}`);
    console.log(`✅ Active routes: ${activeRoutes}\n`);

    // 5. Display route summary
    const routes = await prisma.route.findMany({
      where: { active: true },
      include: {
        bus: { select: { plateNumber: true, capacity: true } }
      },
      orderBy: [
        { origin: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    console.log('\n📊 ROUTE SUMMARY:');
    console.log('─'.repeat(80));
    
    const routesByOrigin = routes.reduce((acc, route) => {
      if (!acc[route.origin]) acc[route.origin] = [];
      acc[route.origin].push(route);
      return acc;
    }, {});

    for (const [origin, originRoutes] of Object.entries(routesByOrigin)) {
      console.log(`\n📍 FROM ${origin.toUpperCase()}:`);
      originRoutes.forEach(route => {
        console.log(`   → ${route.destination} @ ${route.departureTime} | UGX ${route.price.toLocaleString()} | ${route.bus.plateNumber} (${route.bus.capacity} seats)`);
      });
    }

    console.log('\n' + '─'.repeat(80));
    console.log('✅ PRODUCTION DATABASE SEEDED SUCCESSFULLY!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: operator@transconnect.ug');
    console.log('   Password: operator123');
    console.log('\n🌐 Test at: https://transconnect.app\n');

  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
