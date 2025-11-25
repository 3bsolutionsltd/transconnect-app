const { PrismaClient } = require('@prisma/client');

async function checkAgents() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking registered agents...\n');
    
    const agents = await prisma.agent.findMany({
      include: {
        wallet: true,
        kycVerification: true
      }
    });
    
    console.log(`📊 Total Agents: ${agents.length}\n`);
    
    if (agents.length > 0) {
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name}`);
        console.log(`   Phone: ${agent.phone}`);
        console.log(`   Email: ${agent.email || 'Not provided'}`);
        console.log(`   Status: ${agent.status}`);
        console.log(`   KYC Status: ${agent.kycStatus}`);
        console.log(`   Referral Code: ${agent.referralCode}`);
        console.log(`   Balance: UGX ${agent.wallet?.balance || 0}`);
        console.log(`   Created: ${agent.createdAt}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No agents found in database');
    }
    
    // Check KYC verifications
    const kycVerifications = await prisma.kYCVerification.findMany({
      include: {
        agent: true
      }
    });
    
    console.log(`\n📋 KYC Verifications: ${kycVerifications.length}`);
    if (kycVerifications.length > 0) {
      kycVerifications.forEach((kyc, index) => {
        console.log(`${index + 1}. Agent: ${kyc.agent.name}`);
        console.log(`   Status: ${kyc.status}`);
        console.log(`   Document Type: ${kyc.documentType || 'Not uploaded'}`);
        console.log(`   Document URL: ${kyc.documentUrl || 'None'}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking agents:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgents();