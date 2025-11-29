const { PrismaClient } = require('@prisma/client');

async function checkExistingAgents() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking existing agents in database...\n');
    
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (agents.length === 0) {
      console.log('❌ No agents found in database');
      console.log('\n📝 To test agent functionality, you need to:');
      console.log('1. Register a new agent using the agent registration endpoint');
      console.log('2. Verify the agent with OTP');
      console.log('3. Get admin approval (if required)');
      console.log('\n🧪 Would you like me to create a test agent?');
    } else {
      console.log(`✅ Found ${agents.length} agent(s):\n`);
      
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. Agent ID: ${agent.id}`);
        console.log(`   Name: ${agent.name}`);
        console.log(`   Phone: ${agent.phone}`);
        console.log(`   Email: ${agent.email || 'Not provided'}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   Created: ${agent.createdAt.toISOString()}`);
        console.log('');
      });
      
      const activeAgents = agents.filter(a => a.status === 'ACTIVE');
      const pendingAgents = agents.filter(a => a.status === 'PENDING');
      
      if (activeAgents.length > 0) {
        console.log('✅ Active agents you can test with:');
        activeAgents.forEach(agent => {
          console.log(`   - Phone: ${agent.phone} (ID: ${agent.id})`);
        });
      }
      
      if (pendingAgents.length > 0) {
        console.log('\n⏳ Pending agents (need verification/approval):');
        pendingAgents.forEach(agent => {
          console.log(`   - Phone: ${agent.phone} (Status: ${agent.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking agents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingAgents();