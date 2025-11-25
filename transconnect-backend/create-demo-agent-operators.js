// Quick test to add agent-registered operators for demo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAgentOperatorsDemo() {
  try {
    console.log('🎯 Adding Agent-Registered Operators for Demo...\n');

    // Get existing demo agent or create one
    let demoAgent = await prisma.agent.findUnique({
      where: { referralCode: 'AGT001' }
    });

    if (!demoAgent) {
      demoAgent = await prisma.agent.create({
        data: {
          name: 'Demo Agent',
          phone: '+256700123999',
          email: 'demo.agent@transconnect.ug',
          referralCode: 'AGT001',
          status: 'APPROVED'
        }
      });
    }

    console.log(`✅ Demo Agent: ${demoAgent.name} (${demoAgent.referralCode})`);

    // Create agent-registered operators
    const agentOperators = [
      {
        companyName: 'SafeRide Express',
        license: 'SRE-2024-AGENT-001',
        email: 'saferide@agent.transconnect.ug',
        phone: '+256703456789',
        firstName: 'SafeRide',
        lastName: 'Manager',
        approved: false, // Pending approval
      },
      {
        companyName: 'QuickTransit Ltd', 
        license: 'QTL-2024-AGENT-002',
        email: 'quicktransit@agent.transconnect.ug',
        phone: '+256704567890',
        firstName: 'Quick',
        lastName: 'Transit',
        approved: false, // Pending approval
      },
      {
        companyName: 'FastTrack Buses',
        license: 'FTB-2024-AGENT-003', 
        email: 'fasttrack@agent.transconnect.ug',
        phone: '+256705678901',
        firstName: 'FastTrack',
        lastName: 'Operations',
        approved: true, // Already approved
      }
    ];

    for (const opData of agentOperators) {
      // Create user first
      const user = await prisma.user.create({
        data: {
          firstName: opData.firstName,
          lastName: opData.lastName,
          email: opData.email,
          phone: opData.phone,
          password: 'hashedpassword123', // Demo password
          role: 'OPERATOR'
        }
      });

      // Create operator
      const operator = await prisma.operator.create({
        data: {
          companyName: opData.companyName,
          license: opData.license,
          approved: opData.approved,
          userId: user.id,
          agentId: demoAgent.id,
          managedByAgent: true
        }
      });

      console.log(`✅ Created: ${operator.companyName} (${operator.approved ? 'Approved' : 'Pending'})`);
    }

    console.log('\n🎉 Demo Data Created Successfully!');
    console.log('\nAdmin Panel will now show:');
    console.log('• Mix of admin-managed and agent-registered operators');
    console.log('• Pending operators with approval buttons');
    console.log('• Management filter options working');
    console.log('• Agent information in Management column');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addAgentOperatorsDemo();