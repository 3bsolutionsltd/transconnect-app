const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function debugFelistarProduction() {
  try {
    console.log('🔍 Debugging Felistar operator in PRODUCTION...\n');
    
    // Find the Felistar operator specifically
    const felistarOperator = await prisma.operator.findFirst({
      where: {
        companyName: {
          contains: 'Felistar',
          mode: 'insensitive'
        }
      },
      include: {
        user: true,
        buses: true,
        operatorUsers: {
          include: {
            user: true
          }
        }
      }
    });

    if (!felistarOperator) {
      console.log('❌ No Felistar operator found');
      return;
    }

    console.log('✅ Found Felistar Operator:');
    console.log(`   Company: ${felistarOperator.companyName}`);
    console.log(`   ID: ${felistarOperator.id}`);
    console.log(`   User ID: ${felistarOperator.userId}`);
    console.log(`   Approved: ${felistarOperator.approved}`);
    console.log(`   Buses Count: ${felistarOperator.buses.length}`);
    console.log(`   OperatorUsers Count: ${felistarOperator.operatorUsers.length}`);
    
    console.log('\n🚌 Buses:');
    felistarOperator.buses.forEach(bus => {
      console.log(`   - ${bus.plateNumber} (${bus.model}) - Capacity: ${bus.capacity}`);
    });
    
    console.log('\n👤 Main User Details:');
    if (felistarOperator.user) {
      console.log(`   - ID: ${felistarOperator.user.id}`);
      console.log(`   - Name: ${felistarOperator.user.firstName} ${felistarOperator.user.lastName}`);
      console.log(`   - Email: ${felistarOperator.user.email}`);
      console.log(`   - Role: ${felistarOperator.user.role}`);
    }
    
    console.log('\n👥 OperatorUser Relationships:');
    if (felistarOperator.operatorUsers.length === 0) {
      console.log('   ❌ NO OPERATOR USER RELATIONSHIPS FOUND!');
      console.log('   This is likely why the operator cannot see their buses.');
      console.log('   The operator login works, but bus filtering fails due to missing OperatorUser record.');
    } else {
      felistarOperator.operatorUsers.forEach(opUser => {
        console.log(`   - User: ${opUser.user.firstName} ${opUser.user.lastName} (${opUser.user.email})`);
        console.log(`   - Role: ${opUser.role}`);
        console.log(`   - User ID: ${opUser.userId}`);
      });
    }

    // Check what the bus filtering logic would return
    console.log('\n🔍 Testing Bus Filtering Logic:');
    
    // This is what the operator buses endpoint does
    const operatorUserId = felistarOperator.userId;
    console.log(`   Looking for buses where operator user ID = ${operatorUserId}`);
    
    // Direct operator check
    const busesByDirectOperator = await prisma.bus.findMany({
      where: {
        operator: {
          userId: operatorUserId
        }
      },
      include: {
        operator: true
      }
    });
    
    console.log(`   Direct operator buses found: ${busesByDirectOperator.length}`);
    busesByDirectOperator.forEach(bus => {
      console.log(`     - ${bus.plateNumber} via direct operator`);
    });
    
    // OperatorUser check (this is likely failing)
    const busesByOperatorUser = await prisma.bus.findMany({
      where: {
        operator: {
          operatorUsers: {
            some: {
              userId: operatorUserId
            }
          }
        }
      },
      include: {
        operator: true
      }
    });
    
    console.log(`   OperatorUser buses found: ${busesByOperatorUser.length}`);
    busesByOperatorUser.forEach(bus => {
      console.log(`     - ${bus.plateNumber} via OperatorUser relationship`);
    });
    
  } catch (error) {
    console.error('❌ Error debugging Felistar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFelistarProduction();