const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('=== DATABASE STATUS CHECK ===\n');
    
    // Check agents
    const agentCount = await prisma.agent.count();
    console.log(`📊 Agents in database: ${agentCount}`);
    
    if (agentCount > 0) {
      const agents = await prisma.agent.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          referralCode: true,
          level: true,
          createdAt: true
        }
      });
      console.log('\n🧑‍💼 Agent Details:');
      agents.forEach((agent, index) => {
        console.log(`  ${index + 1}. ${agent.name} (${agent.email || 'No email'})`);
        console.log(`     ID: ${agent.id}, Phone: ${agent.phone}`);
        console.log(`     Status: ${agent.status}, Level: ${agent.level}`);
        console.log(`     Referral Code: ${agent.referralCode}`);
        console.log(`     Created: ${agent.createdAt.toLocaleDateString()}`);
      });
    }
    
    // Check operators
    const operatorCount = await prisma.operator.count();
    console.log(`\n📊 Operators in database: ${operatorCount}`);
    
    if (operatorCount > 0) {
      const operators = await prisma.operator.findMany({
        select: {
          id: true,
          companyName: true,
          license: true,
          approved: true,
          agentId: true,
          managedByAgent: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });
      console.log('\n🚌 Operator Details:');
      operators.forEach((operator, index) => {
        console.log(`  ${index + 1}. ${operator.companyName}`);
        console.log(`     Contact: ${operator.user.firstName} ${operator.user.lastName} (${operator.user.email})`);
        console.log(`     Phone: ${operator.user.phone}`);
        console.log(`     License: ${operator.license}`);
        console.log(`     Status: ${operator.approved ? 'Approved' : 'Pending'}`);
        console.log(`     Agent ID: ${operator.agentId || 'None'}`);
        console.log(`     Managed by Agent: ${operator.managedByAgent ? 'Yes' : 'No'}`);
        console.log(`     Created: ${operator.createdAt.toLocaleDateString()}`);
      });
    }
    
    // Check agent-operator relationships
    if (agentCount > 0 && operatorCount > 0) {
      const managedOperators = await prisma.operator.count({
        where: { managedByAgent: true }
      });
      console.log(`\n🔗 Operators managed by agents: ${managedOperators}`);
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('📈 Database contains REAL data that would be visible to TransConnect admins');
    console.log('🎭 Frontend currently shows DEMO data for testing purposes');
    console.log('💡 Demo data is client-side only and not stored in database');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();