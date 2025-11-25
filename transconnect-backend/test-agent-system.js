const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAgentSystem() {
  console.log('🧪 Testing Agent Onboarding System...\n');

  try {
    // Test 1: Create a new agent
    console.log('1. Creating a new agent...');
    const agent = await prisma.agent.create({
      data: {
        name: 'John Doe',
        phone: '+256700123456',
        email: 'john.doe@example.com',
        referralCode: 'JOHN1234',
        status: 'VERIFIED',
      },
    });
    console.log('✅ Agent created:', agent.name, '| ID:', agent.id);

    // Test 2: Create agent wallet
    console.log('\n2. Creating agent wallet...');
    const wallet = await prisma.agentWallet.create({
      data: {
        agentId: agent.id,
        balance: 0,
      },
    });
    console.log('✅ Wallet created with balance:', wallet.balance);

    // Test 3: Create KYC verification record
    console.log('\n3. Creating KYC verification record...');
    const kyc = await prisma.kYCVerification.create({
      data: {
        agentId: agent.id,
        status: 'PENDING',
      },
    });
    console.log('✅ KYC record created with status:', kyc.status);

    // Test 4: Create a second agent as referral
    console.log('\n4. Creating a referred agent...');
    const referredAgent = await prisma.agent.create({
      data: {
        name: 'Jane Smith',
        phone: '+256700654321',
        email: 'jane.smith@example.com',
        referralCode: 'JANE5678',
        referredById: agent.id,
        status: 'VERIFIED',
      },
    });
    console.log('✅ Referred agent created:', referredAgent.name);

    // Test 5: Create referral record
    console.log('\n5. Creating referral record...');
    const referral = await prisma.referral.create({
      data: {
        agentId: agent.id,
        referredId: referredAgent.id,
        level: 1,
      },
    });
    console.log('✅ Referral record created at level:', referral.level);

    // Test 6: Create commission record
    console.log('\n6. Creating commission record...');
    const commission = await prisma.commission.create({
      data: {
        agentId: agent.id,
        fromAgentId: referredAgent.id,
        amount: 1000,
        level: 1,
        status: 'PAID',
      },
    });
    console.log('✅ Commission created: UGX', commission.amount);

    // Test 7: Create wallet transaction
    console.log('\n7. Creating wallet transaction...');
    const transaction = await prisma.agentTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'COMMISSION',
        amount: 1000,
        description: 'Level 1 referral commission',
      },
    });
    console.log('✅ Transaction created:', transaction.type, 'UGX', transaction.amount);

    // Test 8: Update wallet balance
    console.log('\n8. Updating wallet balance...');
    const updatedWallet = await prisma.agentWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: 1000 } },
    });
    console.log('✅ Wallet balance updated to: UGX', updatedWallet.balance);

    // Test 9: Query full agent data
    console.log('\n9. Querying full agent data...');
    const fullAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: {
        wallet: true,
        kycVerification: true,
        referrals: true,
        commissions: true,
      },
    });
    
    console.log('✅ Full agent data retrieved:');
    console.log('   - Name:', fullAgent.name);
    console.log('   - Wallet Balance: UGX', fullAgent.wallet.balance);
    console.log('   - KYC Status:', fullAgent.kycVerification.status);
    console.log('   - Direct Referrals:', fullAgent.referrals.length);
    console.log('   - Total Commissions:', fullAgent.commissions.length);

    console.log('\n🎉 All agent system tests passed successfully!');
    console.log('\n📊 System Summary:');
    console.log('   - Agents created: 2');
    console.log('   - Wallets created: 1');
    console.log('   - KYC records: 1');
    console.log('   - Referrals: 1');
    console.log('   - Commissions: 1');
    console.log('   - Transactions: 1');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testAgentSystem();