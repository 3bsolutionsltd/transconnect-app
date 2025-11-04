const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addTestOperators() {
  try {
    console.log('🏗️ Adding test operators and buses...\n');

    // Create operators with users
    const operators = [
      {
        companyName: 'Swift Coach Services',
        license: 'SCS-2024-001',
        user: {
          firstName: 'James',
          lastName: 'Mwangi',
          email: 'james@swiftcoach.com',
          phone: '+256791234567',
          password: await bcrypt.hash('password123', 10),
          role: 'OPERATOR'
        }
      },
      {
        companyName: 'East Africa Express',
        license: 'EAE-2024-002',
        user: {
          firstName: 'Sarah',
          lastName: 'Nakato',
          email: 'sarah@eaexpress.com',
          phone: '+256792345678',
          password: await bcrypt.hash('password123', 10),
          role: 'OPERATOR'
        }
      },
      {
        companyName: 'Highland Coaches',
        license: 'HC-2024-003',
        user: {
          firstName: 'David',
          lastName: 'Kimani',
          email: 'david@highland.com',
          phone: '+256793456789',
          password: await bcrypt.hash('password123', 10),
          role: 'OPERATOR'
        }
      }
    ];

    for (const operatorData of operators) {
      // Create user first
      const user = await prisma.user.create({
        data: operatorData.user
      });

      // Create operator
      const operator = await prisma.operator.create({
        data: {
          companyName: operatorData.companyName,
          license: operatorData.license,
          approved: Math.random() > 0.5, // Random approval status
          userId: user.id
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`✅ Created operator: ${operator.companyName}`);
      console.log(`   Contact: ${operator.user.firstName} ${operator.user.lastName}`);
      console.log(`   Email: ${operator.user.email}`);
      console.log(`   Status: ${operator.approved ? 'Approved' : 'Pending'}\n`);

      // Add buses for each operator
      const busModels = [
        { model: 'Toyota Hiace', capacity: 14, amenities: 'AC, WiFi' },
        { model: 'Nissan Civilian', capacity: 29, amenities: 'AC, Music System' },
        { model: 'Isuzu NQR', capacity: 33, amenities: 'AC, WiFi, Charging ports' },
        { model: 'Mercedes Sprinter', capacity: 22, amenities: 'AC, WiFi, TV' }
      ];

      const numBuses = Math.floor(Math.random() * 3) + 2; // 2-4 buses per operator
      
      for (let i = 0; i < numBuses; i++) {
        const busModel = busModels[Math.floor(Math.random() * busModels.length)];
        const plateNumber = `${operatorData.companyName.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
        
        const bus = await prisma.bus.create({
          data: {
            plateNumber,
            model: busModel.model,
            capacity: busModel.capacity,
            amenities: busModel.amenities,
            operatorId: operator.id,
            active: Math.random() > 0.2 // 80% chance of being active
          }
        });

        console.log(`   🚌 Added bus: ${bus.plateNumber} - ${bus.model} (${bus.capacity} seats)`);
      }
      
      console.log('');
    }

    // Summary
    const totalOperators = await prisma.operator.count();
    const approvedOperators = await prisma.operator.count({ where: { approved: true } });
    const totalBuses = await prisma.bus.count();
    const activeBuses = await prisma.bus.count({ where: { active: true } });

    console.log('📊 Summary:');
    console.log(`   Total Operators: ${totalOperators}`);
    console.log(`   Approved Operators: ${approvedOperators}`);
    console.log(`   Total Buses: ${totalBuses}`);
    console.log(`   Active Buses: ${activeBuses}`);
    console.log('\n✅ Test data added successfully!');

  } catch (error) {
    console.error('❌ Error adding test operators:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestOperators();