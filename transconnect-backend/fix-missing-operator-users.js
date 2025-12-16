// Fix script to add missing OperatorUser relationships for operators created by agents
// This should be run on production to fix operators who can't see their buses

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMissingOperatorUsers() {
  try {
    console.log('🔧 Starting fix for missing OperatorUser relationships...\n');
    
    // Find all operators that don't have OperatorUser relationships
    const operatorsWithoutOperatorUsers = await prisma.operator.findMany({
      where: {
        operatorUsers: {
          none: {}  // Operators with no OperatorUser relationships
        }
      },
      include: {
        user: true,
        operatorUsers: true
      }
    });

    console.log(`Found ${operatorsWithoutOperatorUsers.length} operators missing OperatorUser relationships:`);
    
    for (const operator of operatorsWithoutOperatorUsers) {
      console.log(`\n📝 Fixing operator: ${operator.companyName}`);
      console.log(`   - Operator ID: ${operator.id}`);
      console.log(`   - User ID: ${operator.userId}`);
      console.log(`   - User: ${operator.user?.firstName} ${operator.user?.lastName} (${operator.user?.email})`);
      
      // Create the missing OperatorUser relationship
      try {
        const operatorUser = await prisma.operatorUser.create({
          data: {
            userId: operator.userId,
            operatorId: operator.id,
            role: 'MANAGER',
            permissions: ['manage_all'],
            active: true
          }
        });
        
        console.log(`   ✅ Created OperatorUser relationship: ${operatorUser.id}`);
      } catch (error) {
        console.log(`   ❌ Failed to create OperatorUser: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Fix completed! Processed ${operatorsWithoutOperatorUsers.length} operators.`);
    
    // Verify the fix
    console.log('\n🔍 Verification - Operators still missing OperatorUser relationships:');
    const remainingBrokenOperators = await prisma.operator.findMany({
      where: {
        operatorUsers: {
          none: {}
        }
      },
      select: {
        companyName: true,
        id: true
      }
    });
    
    if (remainingBrokenOperators.length === 0) {
      console.log('   ✅ All operators now have OperatorUser relationships!');
    } else {
      console.log(`   ⚠️  Still ${remainingBrokenOperators.length} operators without OperatorUser relationships:`);
      remainingBrokenOperators.forEach(op => {
        console.log(`     - ${op.companyName} (${op.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error running fix script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingOperatorUsers();