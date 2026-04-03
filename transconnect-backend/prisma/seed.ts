import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@transconnect.ug' },
    update: {},
    create: {
      email: 'admin@transconnect.ug',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+256700000000',
      role: 'ADMIN',
      verified: true
    }
  });

  // Create test passenger
  const passengerPassword = await bcrypt.hash('password123', 12);
  const passenger = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: passengerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+256701234567',
      role: 'PASSENGER',
      verified: true
    }
  });

  // Create operator
  const operatorPassword = await bcrypt.hash('operator123', 12);
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator@buscompany.ug' },
    update: {},
    create: {
      email: 'operator@buscompany.ug',
      password: operatorPassword,
      firstName: 'Bus',
      lastName: 'Operator',
      phone: '+256702345678',
      role: 'OPERATOR',
      verified: true
    }
  });

  // Create operator company
  const operator = await prisma.operator.upsert({
    where: { userId: operatorUser.id },
    update: {},
    create: {
      companyName: 'Uganda Bus Company',
      license: 'UBC-2024-001',
      approved: true,
      userId: operatorUser.id
    }
  });

  // Create buses
  const bus1 = await prisma.bus.upsert({
    where: { plateNumber: 'UBE-001A' },
    update: {},
    create: {
      plateNumber: 'UBE-001A',
      model: 'Toyota Hiace',
      capacity: 45,
      amenities: JSON.stringify(['AC', 'WiFi', 'USB Charging']),
      operatorId: operator.id,
      active: true
    }
  });

  const bus2 = await prisma.bus.upsert({
    where: { plateNumber: 'UBE-002B' },
    update: {},
    create: {
      plateNumber: 'UBE-002B',
      model: 'Isuzu Bus',
      capacity: 50,
      amenities: JSON.stringify(['AC', 'Entertainment System']),
      operatorId: operator.id,
      active: true
    }
  });

  // Create routes
  const routes = [
    {
      origin: 'Kampala',
      destination: 'Jinja',
      distance: 80.5,
      duration: 150, // 2.5 hours
      price: 15000,
      departureTime: '08:00',
      busId: bus1.id
    },
    {
      origin: 'Kampala',
      destination: 'Mbarara',
      distance: 266.0,
      duration: 255, // 4.25 hours
      price: 25000,
      departureTime: '09:00',
      busId: bus2.id
    },
    {
      origin: 'Entebbe',
      destination: 'Kampala',
      distance: 41.0,
      duration: 90, // 1.5 hours
      price: 12000,
      departureTime: '07:30',
      busId: bus1.id
    },
    {
      origin: 'Jinja',
      destination: 'Kampala',
      distance: 80.5,
      duration: 165, // 2.75 hours
      price: 15000,
      departureTime: '17:00',
      busId: bus1.id
    }
  ];

  const createdRoutes: any[] = [];
  for (const routeData of routes) {
    const route = await prisma.route.upsert({
      where: {
        id: `${routeData.origin}-${routeData.destination}-${routeData.departureTime}`
      },
      update: {},
      create: {
        ...routeData,
        operatorId: operator.id,
        active: true,
        segmentEnabled: true, // Enable segments for searchability
      }
    });
    createdRoutes.push(route);

    // Create a simple segment for each route (single segment from origin to destination)
    await prisma.routeSegment.upsert({
      where: {
        id: `segment-${route.id}`
      },
      update: {},
      create: {
        id: `segment-${route.id}`,
        routeId: route.id,
        segmentOrder: 1,
        fromLocation: routeData.origin,
        toLocation: routeData.destination,
        distanceKm: routeData.distance,
        durationMinutes: routeData.duration,
        basePrice: routeData.price,
      }
    });
  }

  // Create some test bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  dayAfterTomorrow.setHours(0, 0, 0, 0);

  const bookings = [
    {
      id: 'booking-test-001',
      userId: passenger.id,
      routeId: createdRoutes[0].id,
      travelDate: tomorrow,
      seatNumber: 'A1',
      totalAmount: createdRoutes[0].price,
      status: 'CONFIRMED' as any,
      qrCode: 'QR-TEST-001'
    },
    {
      id: 'booking-test-002',
      userId: passenger.id,
      routeId: createdRoutes[1].id,
      travelDate: tomorrow,
      seatNumber: 'B5',
      totalAmount: createdRoutes[1].price,
      status: 'CONFIRMED' as any,
      qrCode: 'QR-TEST-002'
    },
    {
      id: 'booking-test-003',
      userId: passenger.id,
      routeId: createdRoutes[0].id,
      travelDate: dayAfterTomorrow,
      seatNumber: 'C3',
      totalAmount: createdRoutes[0].price,
      status: 'PENDING' as any,
      qrCode: 'QR-TEST-003'
    }
  ];

  for (const bookingData of bookings) {
    await prisma.booking.upsert({
      where: { id: bookingData.id },
      update: {},
      create: bookingData
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Admin user: admin@transconnect.ug / admin123`);
  console.log(`👤 Test passenger: john@example.com / password123`);
  console.log(`🚌 Created ${routes.length} routes`);
  console.log(`📝 Created ${bookings.length} test bookings`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });