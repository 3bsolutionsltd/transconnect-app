const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedStagingData() {
  console.log('🌱 Seeding staging database...');
  console.log(`📍 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}\n`);

  try {
    // Hash password for test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create test operators
    console.log('Creating operators...');
    const operators = [];
    const operatorNames = [
      'Kampala Coach', 'Gateway Bus', 'Post Bus', 'Gaaga Bus',
      'Link Bus', 'Horizon Bus', 'Kalita Bus', 'YY Coach',
      'Modern Coast', 'Excel Bus'
    ];

    for (let i = 0; i < operatorNames.length; i++) {
      const operator = await prisma.operator.create({
        data: {
          companyName: operatorNames[i],
          email: `${operatorNames[i].toLowerCase().replace(/\s/g, '')}@staging.com`,
          phoneNumber: `+2567${faker.string.numeric(8)}`,
          license: `LIC${faker.string.numeric(6)}`,
          licenseNumber: `LIC${faker.string.numeric(6)}`,
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'pending']), // 75% active
          address: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(['Kampala', 'Entebbe', 'Jinja', 'Mbarara'])
        }
      });
      operators.push(operator);
    }
    console.log(`✅ Created ${operators.length} operators\n`);

    // 2. Create test buses
    console.log('Creating buses...');
    const buses = [];
    const busModels = ['Mercedes Benz', 'Volvo', 'Scania', 'MAN', 'Isuzu', 'Toyota Coaster'];
    
    for (const operator of operators) {
      const busCount = faker.number.int({ min: 3, max: 8 });
      for (let i = 0; i < busCount; i++) {
        const capacity = faker.helpers.arrayElement([45, 50, 52, 62, 33]); // 33 for coasters
        const bus = await prisma.bus.create({
          data: {
            operatorId: operator.id,
            registrationNumber: `U${faker.helpers.arrayElement(['A', 'B', 'C'])}${faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'])} ${faker.string.numeric(3)}${faker.string.alpha(1).toUpperCase()}`,
            model: faker.helpers.arrayElement(busModels),
            capacity: capacity,
            amenities: faker.helpers.arrayElements(['AC', 'WiFi', 'USB Charging', 'Reclining Seats', 'TV', 'Toilet'], faker.number.int({ min: 2, max: 4 })),
            status: 'active'
          }
        });
        buses.push(bus);
      }
    }
    console.log(`✅ Created ${buses.length} buses\n`);

    // 3. Create test routes with segments
    console.log('Creating routes with segments...');
    const ugandaTowns = [
      'Kampala', 'Entebbe', 'Masaka', 'Mbarara', 'Kabale',
      'Jinja', 'Mbale', 'Soroti', 'Lira', 'Gulu',
      'Fort Portal', 'Kasese', 'Hoima', 'Arua', 'Tororo',
      'Lyantonde', 'Ntungamo', 'Bushenyi', 'Rukungiri', 'Iganga',
      'Kamuli', 'Pallisa', 'Kumi', 'Katakwi', 'Moroto'
    ];

    // Popular routes (more frequent)
    const popularRoutes = [
      { origin: 'Kampala', destination: 'Mbarara', vias: ['Masaka', 'Lyantonde'], distance: 266, duration: 240, price: 35000 },
      { origin: 'Kampala', destination: 'Kabale', vias: ['Masaka', 'Mbarara', 'Ntungamo'], distance: 420, duration: 360, price: 45000 },
      { origin: 'Kampala', destination: 'Gulu', vias: ['Luwero', 'Nakasongola', 'Karuma'], distance: 340, duration: 300, price: 40000 },
      { origin: 'Kampala', destination: 'Mbale', vias: ['Jinja', 'Iganga', 'Tororo'], distance: 245, duration: 240, price: 30000 },
      { origin: 'Kampala', destination: 'Jinja', vias: ['Mukono', 'Lugazi'], distance: 81, duration: 90, price: 15000 },
      { origin: 'Kampala', destination: 'Fort Portal', vias: ['Mityana', 'Mubende', 'Kyenjojo'], distance: 320, duration: 300, price: 35000 },
      { origin: 'Kampala', destination: 'Kasese', vias: ['Fort Portal', 'Bundibugyo'], distance: 450, duration: 420, price: 50000 }
    ];

    const routes = [];
    
    // Create popular routes for multiple operators
    for (const operator of operators.filter(o => o.status === 'active')) {
      const routesToCreate = faker.helpers.arrayElements(popularRoutes, faker.number.int({ min: 3, max: 6 }));
      
      for (const routeTemplate of routesToCreate) {
        // Add some variation to prices
        const priceVariation = faker.number.int({ min: -3000, max: 5000 });
        const basePrice = routeTemplate.price + priceVariation;

        const route = await prisma.route.create({
          data: {
            operatorId: operator.id,
            origin: routeTemplate.origin,
            destination: routeTemplate.destination,
            distance: routeTemplate.distance,
            duration: routeTemplate.duration,
            basePrice: basePrice,
            vias: routeTemplate.vias,
            segmentEnabled: true,
            autoCalculated: false,
            status: 'active'
          }
        });
        routes.push(route);

        // Create segments for this route
        const locations = [routeTemplate.origin, ...routeTemplate.vias, routeTemplate.destination];
        const totalDistance = routeTemplate.distance;
        const segmentCount = locations.length - 1;

        for (let j = 0; j < segmentCount; j++) {
          // Distribute distance and price proportionally
          const segmentDistanceRatio = 1 / segmentCount;
          const segmentDistance = (totalDistance * segmentDistanceRatio).toFixed(2);
          const segmentPrice = Math.round(basePrice / segmentCount / 1000) * 1000; // Round to nearest 1000

          const segment = await prisma.routeSegment.create({
            data: {
              routeId: route.id,
              segmentOrder: j + 1,
              fromLocation: locations[j],
              toLocation: locations[j + 1],
              distanceKm: parseFloat(segmentDistance),
              durationMinutes: Math.round(routeTemplate.duration / segmentCount),
              basePrice: segmentPrice
            }
          });

          // Add weekend pricing variation (15-25% premium)
          if (Math.random() > 0.3) { // 70% of segments have weekend pricing
            await prisma.segmentPriceVariation.create({
              data: {
                segmentId: segment.id,
                variationType: 'weekend',
                priceAdjustment: faker.number.int({ min: 15, max: 25 }),
                adjustmentType: 'percentage',
                appliesToDates: { days: ['saturday', 'sunday'] },
                active: true
              }
            });
          }

          // Add holiday pricing for some segments
          if (Math.random() > 0.7) { // 30% have holiday pricing
            await prisma.segmentPriceVariation.create({
              data: {
                segmentId: segment.id,
                variationType: 'holiday',
                priceAdjustment: faker.number.int({ min: 20, max: 35 }),
                adjustmentType: 'percentage',
                appliesToDates: {
                  dates: ['2026-12-25', '2026-12-26', '2026-01-01', '2026-01-02']
                },
                active: true
              }
            });
          }
        }
      }
    }
    console.log(`✅ Created ${routes.length} routes with segments\n`);

    // 4. Create test schedules (next 30 days)
    console.log('Creating schedules...');
    const schedules = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Create schedules for each route (2-4 trips per day)
      for (const route of routes) {
        const tripsPerDay = faker.number.int({ min: 2, max: 4 });
        const operatorBuses = buses.filter(b => b.operatorId === route.operatorId);

        for (let trip = 0; trip < tripsPerDay; trip++) {
          const bus = faker.helpers.arrayElement(operatorBuses);
          
          // Common departure times: 6am, 9am, 12pm, 3pm, 6pm
          const departureTimes = [6, 9, 12, 15, 18];
          const departureHour = departureTimes[trip % departureTimes.length];
          
          const departureTime = new Date(date);
          departureTime.setHours(departureHour, faker.number.int({ min: 0, max: 30 }), 0, 0);

          const arrivalTime = new Date(departureTime);
          arrivalTime.setMinutes(arrivalTime.getMinutes() + route.duration);

          const schedule = await prisma.busSchedule.create({
            data: {
              busId: bus.id,
              routeId: route.id,
              departureTime: departureTime,
              arrivalTime: arrivalTime,
              availableSeats: bus.capacity,
              status: 'scheduled'
            }
          });
          schedules.push(schedule);
        }
      }
    }
    console.log(`✅ Created ${schedules.length} schedules\n`);

    // 5. Create test users
    console.log('Creating users...');
    const users = [];
    const ugandanNames = {
      first: ['Moses', 'Sarah', 'John', 'Mary', 'David', 'Grace', 'Paul', 'Rebecca', 'Isaac', 'Ruth',
              'Joshua', 'Esther', 'Samuel', 'Deborah', 'Daniel', 'Lydia', 'Peter', 'Martha', 'James', 'Rachel'],
      last: ['Okello', 'Nakato', 'Mugisha', 'Namukasa', 'Ssemakula', 'Atim', 'Byaruhanga', 'Akello',
             'Musoke', 'Akoth', 'Wasswa', 'Nalongo', 'Kizza', 'Auma', 'Tumwine', 'Aber', 'Kasozi', 'Adong']
    };

    for (let i = 0; i < 150; i++) {
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          phoneNumber: `+2567${faker.string.numeric(8)}`,
          password: hashedPassword,
          firstName: faker.helpers.arrayElement(ugandanNames.first),
          lastName: faker.helpers.arrayElement(ugandanNames.last),
          role: 'PASSENGER',
          emailVerified: faker.datatype.boolean(0.8) // 80% verified
        }
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users\n`);

    // 6. Create test bookings
    console.log('Creating bookings...');
    const bookings = [];
    const seatLetters = ['A', 'B', 'C', 'D'];
    
    // Create bookings for past schedules (already traveled)
    const pastSchedules = schedules.filter(s => s.departureTime < new Date());
    for (const schedule of pastSchedules) {
      const bookingCount = faker.number.int({ min: 10, max: Math.floor(schedule.bus.capacity * 0.9) });
      
      for (let i = 0; i < bookingCount; i++) {
        const user = faker.helpers.arrayElement(users);
        const passengerCount = faker.number.int({ min: 1, max: 3 });
        
        // Generate seat numbers
        const seats = [];
        for (let j = 0; j < passengerCount; j++) {
          seats.push(`${faker.number.int({ min: 1, max: 15 })}${faker.helpers.arrayElement(seatLetters)}`);
        }

        const booking = await prisma.booking.create({
          data: {
            userId: user.id,
            scheduleId: schedule.id,
            seats: seats,
            passengerName: `${user.firstName} ${user.lastName}`,
            passengerPhone: user.phoneNumber,
            passengerEmail: user.email,
            totalPrice: schedule.route.basePrice * passengerCount,
            paymentStatus: faker.helpers.arrayElement(['completed', 'completed', 'completed', 'pending', 'failed']),
            paymentMethod: faker.helpers.arrayElement(['mobile_money', 'mobile_money', 'mobile_money', 'card', 'cash']),
            status: faker.helpers.arrayElement(['confirmed', 'confirmed', 'confirmed', 'cancelled']),
            qrCode: faker.string.alphanumeric(32).toUpperCase()
          }
        });
        bookings.push(booking);

        // Update schedule available seats
        await prisma.busSchedule.update({
          where: { id: schedule.id },
          data: { availableSeats: { decrement: passengerCount } }
        });
      }
    }

    // Create fewer bookings for future schedules
    const futureSchedules = schedules.filter(s => s.departureTime >= new Date()).slice(0, 200);
    for (const schedule of futureSchedules) {
      const bookingCount = faker.number.int({ min: 2, max: 15 });
      
      for (let i = 0; i < bookingCount; i++) {
        const user = faker.helpers.arrayElement(users);
        const passengerCount = faker.number.int({ min: 1, max: 2 });
        
        const seats = [];
        for (let j = 0; j < passengerCount; j++) {
          seats.push(`${faker.number.int({ min: 1, max: 15 })}${faker.helpers.arrayElement(seatLetters)}`);
        }

        const booking = await prisma.booking.create({
          data: {
            userId: user.id,
            scheduleId: schedule.id,
            seats: seats,
            passengerName: `${user.firstName} ${user.lastName}`,
            passengerPhone: user.phoneNumber,
            passengerEmail: user.email,
            totalPrice: schedule.route.basePrice * passengerCount,
            paymentStatus: 'completed',
            paymentMethod: faker.helpers.arrayElement(['mobile_money', 'card']),
            status: 'confirmed',
            qrCode: faker.string.alphanumeric(32).toUpperCase()
          }
        });
        bookings.push(booking);

        await prisma.busSchedule.update({
          where: { id: schedule.id },
          data: { availableSeats: { decrement: passengerCount } }
        });
      }
    }
    console.log(`✅ Created ${bookings.length} bookings\n`);

    // 7. Create admin and operator users
    console.log('Creating admin and operator users...');
    
    // System Admin
    await prisma.user.create({
      data: {
        email: 'admin@transconnect-staging.com',
        phoneNumber: '+256700000001',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        emailVerified: true
      }
    });

    // TransConnect Manager (future role)
    await prisma.user.create({
      data: {
        email: 'manager@transconnect-staging.com',
        phoneNumber: '+256700000002',
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'User',
        role: 'ADMIN', // Will be TRANSCONNECT_MANAGER after role implementation
        emailVerified: true
      }
    });

    // Create operator users (one per active operator)
    for (const operator of operators.filter(o => o.status === 'active')) {
      await prisma.user.create({
        data: {
          email: operator.email,
          phoneNumber: operator.phoneNumber,
          password: hashedPassword,
          firstName: operator.companyName.split(' ')[0],
          lastName: 'Operator',
          role: 'OPERATOR',
          operatorId: operator.id,
          emailVerified: true
        }
      });
    }

    console.log('✅ Created admin, manager, and operator users\n');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 STAGING DATA SEEDED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`  • Operators: ${operators.length}`);
    console.log(`  • Buses: ${buses.length}`);
    console.log(`  • Routes: ${routes.length} (with segments)`);
    console.log(`  • Schedules: ${schedules.length} (next 30 days)`);
    console.log(`  • Users: ${users.length + operators.filter(o => o.status === 'active').length + 2}`);
    console.log(`  • Bookings: ${bookings.length}`);
    console.log('\n🔑 Test Credentials (password: password123):');
    console.log('  • Admin: admin@transconnect-staging.com');
    console.log('  • Manager: manager@transconnect-staging.com');
    console.log('  • Operators: Use operator emails (e.g., kampalacoach@staging.com)');
    console.log('\n💡 Next Steps:');
    console.log('  1. Test segment search: GET /api/routes/search-segments?origin=Masaka&destination=Mbarara');
    console.log('  2. Login to admin dashboard with admin credentials');
    console.log('  3. Run migration script: node scripts/migrate-to-route-segments.js');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    console.error('\nStack trace:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedStagingData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
