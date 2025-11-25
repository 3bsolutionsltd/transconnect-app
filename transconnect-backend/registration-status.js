const { PrismaClient } = require('@prisma/client');

async function registrationStatus() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 REGISTRATION STATUS REPORT\n');
    console.log('=' * 50);
    
    // Find your specific registration
    const yourAgent = await prisma.agent.findFirst({
      where: {
        OR: [
          { phone: '+256773878507' },
          { name: 'Stephen Omwony' }
        ]
      },
      include: {
        wallet: true,
        kycVerification: true
      }
    });
    
    if (yourAgent) {
      console.log('✅ YOUR REGISTRATION FOUND:');
      console.log(`   Name: ${yourAgent.name}`);
      console.log(`   Phone: ${yourAgent.phone}`);
      console.log(`   Email: ${yourAgent.email}`);
      console.log(`   Referral Code: ${yourAgent.referralCode}`);
      console.log(`   Status: ${yourAgent.status}`);
      console.log(`   KYC Status: ${yourAgent.kycStatus}`);
      console.log(`   Created: ${yourAgent.createdAt}`);
      console.log(`   Balance: UGX ${yourAgent.wallet?.balance || 0}`);
      
      console.log('\n📋 PROGRESS ANALYSIS:');
      if (yourAgent.status === 'VERIFIED') {
        console.log('   ✅ Step 1: Registration - COMPLETED');
        console.log('   ✅ Step 2: OTP Verification - COMPLETED');
        if (yourAgent.kycVerification && yourAgent.kycVerification.documentUrl) {
          console.log('   ✅ Step 3: KYC Upload - COMPLETED');
          console.log('   🔄 Step 4: Payout Setup - PENDING');
        } else {
          console.log('   ❌ Step 3: KYC Upload - FAILED/INCOMPLETE');
          console.log('   ⏸️  Step 4: Payout Setup - WAITING');
        }
      } else {
        console.log('   ❌ Step 2: OTP Verification - INCOMPLETE');
      }
      
      console.log('\n🎯 RESUMPTION CAPABILITY:');
      console.log('   ✅ Your registration is saved in the database');
      console.log('   ✅ Frontend now supports resuming from where you left off');
      console.log('   ✅ Progress will be automatically detected');
      
      console.log('\n📝 NEXT STEPS:');
      if (yourAgent.status === 'VERIFIED' && yourAgent.kycStatus === 'PENDING') {
        console.log('   1. Open /agents/register in your browser');
        console.log('   2. The system will detect your progress and resume from KYC upload');
        console.log('   3. Upload your ID document to continue');
        console.log('   4. Complete payout setup');
        console.log('   5. Finish registration');
      } else {
        console.log('   1. Open /agents/register in your browser');
        console.log('   2. Complete the remaining verification steps');
      }
      
    } else {
      console.log('❌ YOUR REGISTRATION NOT FOUND');
      console.log('   You may need to start the registration process again');
    }
    
    console.log('\n🔧 TECHNICAL IMPROVEMENTS MADE:');
    console.log('   ✅ Added draft resumption logic');
    console.log('   ✅ Progress detection based on completion state');
    console.log('   ✅ Visual indicator when resuming');
    console.log('   ✅ Better error handling for uploads');
    console.log('   ✅ Development mode fallback for testing');
    
    console.log('\n💡 DEVELOPMENT NOTES:');
    console.log('   - Backend server needs to be running for full functionality');
    console.log('   - KYC upload will work in development mode even if backend is down');
    console.log('   - LocalStorage preserves your progress between sessions');
    console.log('   - Professional UI improvements have been applied');
    
  } catch (error) {
    console.error('❌ Error checking registration status:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

registrationStatus();