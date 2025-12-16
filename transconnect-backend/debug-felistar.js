const { PrismaClient } = require('@prisma/client');

async function debugFelistarOperator() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Felistar operator setup...\n');
    
    // Get all buses to check for Felistar associations
    console.log('\n🚌 All Buses in Database:');
    const allBuses = await prisma.bus.findMany({
      include: {
        operator: true
      }
    });
    
    allBuses.forEach(bus => {
      console.log(`   - ${bus.plateNumber} (${bus.model}) - Operator: ${bus.operator?.companyName || 'No Operator'} (ID: ${bus.operatorId})`);
    });
    
    console.log('\n👥 All Operators:');
    // Get all operators to see what we have
    const operators = await prisma.operator.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        buses: true,
        operatorUsers: true
      }
    });
    
    if (operators.length === 0) {
      console.log('❌ No Felistar operator found');
      return;
    }
    
    for (const operator of operators) {
      console.log(`✅ Found Operator: ${operator.companyName}`);
      console.log(`   ID: ${operator.id}`);
      console.log(`   Approved: ${operator.approved}`);
      console.log(`   User ID: ${operator.userId}`);
      console.log(`   User Details:`, operator.user);
      console.log(`   Buses Count: ${operator.buses.length}`);
      console.log(`   OperatorUsers Count: ${operator.operatorUsers.length}`);
      
      if (operator.buses.length > 0) {
        console.log('   Buses:');
        operator.buses.forEach(bus => {
          console.log(`     - ${bus.plateNumber} (${bus.model}) - Operator ID: ${bus.operatorId}`);
        });
      }
      
      if (operator.operatorUsers.length > 0) {
        console.log('   OperatorUsers:');
        for (const opUser of operator.operatorUsers) {
          const user = await prisma.user.findUnique({
            where: { id: opUser.userId },
            select: { email: true, firstName: true, lastName: true }
          });
          console.log(`     - User ID: ${opUser.userId} (${user?.email}) - Role: ${opUser.role}`);
        }
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error debugging Felistar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFelistarOperator();