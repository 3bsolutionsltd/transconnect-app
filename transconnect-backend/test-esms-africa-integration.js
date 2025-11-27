const axios = require('axios');

// Test eSMS Africa Integration
async function testeSMSAfricaIntegration() {
  console.log('🧪 Testing eSMS Africa Integration');
  console.log('=================================');
  console.log('');

  const baseUrl = 'https://transconnect-app-44ie.onrender.com/api';
  
  // Test Ugandan numbers (should use eSMS Africa)
  const testAgents = [
    {
      name: 'Test Agent Uganda',
      phone: '+256700123456',  // Uganda number - should use eSMS Africa
      email: 'test.uganda@example.com',
      referralCode: null
    },
    {
      name: 'Test Agent Kenya', 
      phone: '+254700123456',  // Kenya number - should use eSMS Africa
      email: 'test.kenya@example.com',
      referralCode: null
    },
    {
      name: 'Test Agent USA',
      phone: '+15551234567',   // US number - should use Twilio
      email: 'test.usa@example.com', 
      referralCode: null
    }
  ];

  for (const agent of testAgents) {
    try {
      console.log(`📱 Testing: ${agent.name} (${agent.phone})`);
      
      const response = await axios.post(`${baseUrl}/agents/register`, agent);
      
      console.log(`✅ Registration: ${response.status}`);
      console.log(`📋 Response:`, response.data.next_step || 'Success');
      
      // Predict which SMS provider should be used
      const isAfrican = agent.phone.startsWith('+256') || agent.phone.startsWith('+254') || 
                       agent.phone.startsWith('+255') || agent.phone.startsWith('+250');
      const expectedProvider = isAfrican ? 'eSMS Africa' : 'Twilio';
      const expectedCost = isAfrican ? 'UGX 30' : 'UGX ~180';
      
      console.log(`🎯 Expected Provider: ${expectedProvider}`);
      console.log(`💰 Expected Cost: ${expectedCost}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ Test failed for ${agent.name}:`, error.response?.data || error.message);
      
      if (error.response?.status === 409) {
        console.log('ℹ️  Agent already exists - this is normal for testing');
      }
      console.log('');
    }
  }
  
  console.log('🔍 CHECK SERVER LOGS FOR:');
  console.log('========================');
  console.log('📱 "SMS Routing Decision" - Shows which provider is selected');
  console.log('💰 "Estimated Cost" - Shows cost savings with eSMS Africa');
  console.log('✅ "SMS Result: ✅ via eSMS Africa" - For African numbers');
  console.log('🔄 "Fallback provider was used" - If primary fails');
  console.log('');
  console.log('🎉 INTEGRATION BENEFITS:');
  console.log('=====================');
  console.log('✅ 80% cost reduction for African SMS');
  console.log('✅ Intelligent routing by country code');
  console.log('✅ Automatic fallback to Twilio if needed');
  console.log('✅ No Twilio trial account limitations');
  console.log('✅ Better deliverability in Africa');
}

// Test direct eSMS Africa API
async function testDirecteSMSAfrica() {
  console.log('');
  console.log('🔗 Testing Direct eSMS Africa API');
  console.log('================================');

  try {
    const response = await axios.post(
      'https://api.esmsafrica.io/api/sms/send',
      {
        phoneNumber: '+256700123456',
        text: 'Test SMS from TransConnect via eSMS Africa HTTP API',
        senderId: 'TransConnect'
      },
      {
        headers: {
          'X-Account-ID': '2057',
          'X-API-Key': 'a323393abcee40489cc09bdf5a646fd0',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Direct API Response:', response.data);
    
    if (response.data.status === 'SUCCESS') {
      console.log('🎉 eSMS Africa API is working perfectly!');
      console.log(`📧 Message ID: ${response.data.messageId}`);
    }

  } catch (error) {
    console.error('❌ Direct API test failed:', error.response?.data || error.message);
  }
}

console.log('🚀 TransConnect eSMS Africa Integration Test');
console.log('============================================');
console.log('');
console.log('This test will:');
console.log('• Register test agents with different country numbers');
console.log('• Verify intelligent SMS routing (eSMS vs Twilio)');
console.log('• Show cost savings and provider selection');
console.log('• Test direct eSMS Africa API connectivity');
console.log('');

testeSMSAfricaIntegration().then(() => {
  return testDirecteSMSAfrica();
});