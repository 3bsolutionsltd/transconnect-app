const axios = require('axios');

// Test basic MTN API connectivity
async function testBasicConnectivity() {
  console.log('🔍 Testing MTN API Basic Connectivity...\n');
  
  const subscriptionKey = '0f738da37267411baec919ff99ad1e3f';
  
  try {
    // Try a simple API call to test the subscription key
    const response = await axios.get(
      'https://sandbox.momodeveloper.mtn.com/collection/v1_0/accountbalance',
      {
        headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'X-Target-Environment': 'sandbox',
          'Authorization': 'Bearer test' // This will fail but should give us different error
        }
      }
    );
    
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Message:', error.response?.data);
    
    if (error.response?.status === 401) {
      const authHeader = error.response.headers['www-authenticate'];
      if (authHeader && authHeader.includes('invalid subscription key')) {
        console.log('❌ Subscription key is invalid or inactive');
        console.log('\n📋 Next Steps:');
        console.log('1. Go to https://momodeveloper.mtn.com');
        console.log('2. Check your subscription status');
        console.log('3. Ensure you have subscribed to "Collection API"');
        console.log('4. Verify the key is for sandbox environment');
      } else {
        console.log('🔐 Subscription key is valid but authorization failed (expected)');
        console.log('✅ Key validation successful');
      }
    }
  }
}

// Test with secondary key as well
async function testSecondaryKey() {
  console.log('\n🔄 Testing Secondary Key...\n');
  
  const secondaryKey = '31a14f807cd44a12b44b15408af0f4ef';
  
  try {
    const response = await axios.get(
      'https://sandbox.momodeveloper.mtn.com/collection/v1_0/accountbalance',
      {
        headers: {
          'Ocp-Apim-Subscription-Key': secondaryKey,
          'X-Target-Environment': 'sandbox',
          'Authorization': 'Bearer test'
        }
      }
    );
    
  } catch (error) {
    console.log('Secondary Key Status:', error.response?.status);
    console.log('Secondary Key Message:', error.response?.data);
    
    if (error.response?.status === 401) {
      const authHeader = error.response.headers['www-authenticate'];
      if (authHeader && authHeader.includes('invalid subscription key')) {
        console.log('❌ Secondary key is also invalid');
      } else {
        console.log('✅ Secondary key is valid');
      }
    }
  }
}

// Run tests
testBasicConnectivity().then(() => testSecondaryKey());