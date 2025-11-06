const axios = require('axios');

async function testMTNSubscription() {
  console.log('🧪 Testing MTN Subscription Keys...\n');
  
  const keys = [
    { name: 'Primary', key: 'f24474bc3035498c8ae9694188010330' },
    { name: 'Secondary', key: '2a33f068fd51403c928b31b2639b6545' }
  ];
  
  for (const { name, key } of keys) {
    console.log(`🔑 Testing ${name} Key: ${key.substring(0, 8)}...`);
    
    try {
      // Test creating API user - this is the first step in MTN integration
      const referenceId = 'test-' + Date.now();
      
      const response = await axios.post(
        'https://sandbox.momodeveloper.mtn.com/v1_0/apiuser',
        {
          providerCallbackHost: 'transconnect-app-44ie.onrender.com'
        },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': 'sandbox',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ ${name} key is valid! Status:`, response.status);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${name} key failed:`, error.response.status, error.response.data);
        console.log('   Headers:', error.response.headers);
        
        // Analyze error
        if (error.response.status === 401) {
          console.log('   🔍 This indicates invalid subscription key');
        } else if (error.response.status === 409) {
          console.log('   ✅ This indicates key is valid (user already exists)');
        } else if (error.response.status === 400) {
          console.log('   ⚠️ Bad request - detailed error above');
        }
      } else {
        console.log(`❌ ${name} key error:`, error.message);
      }
    }
    
    console.log('');
  }
  
  console.log('📋 Next Steps:');
  console.log('1. If keys are invalid: Check MTN Developer Portal subscription');
  console.log('2. If keys are valid: Proceed with environment variable setup');
  console.log('3. If 409 error: Keys are working, user already exists');
}

testMTNSubscription();