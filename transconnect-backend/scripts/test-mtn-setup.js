const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// MTN Mobile Money sandbox configuration
const MTN_CONFIG = {
  baseUrl: 'https://sandbox.momodeveloper.mtn.com',
  subscriptionKey: '0f738da37267411baec919ff99ad1e3f', // Your primary key
  environment: 'sandbox'
};

async function testMTNConfiguration() {
  console.log('🧪 Testing MTN Mobile Money Configuration...\n');
  
  try {
    // Step 1: Create API User (required for sandbox)
    console.log('📝 Step 1: Creating API User...');
    const referenceId = uuidv4();
    
    const createUserResponse = await axios.post(
      `${MTN_CONFIG.baseUrl}/v1_0/apiuser`,
      {
        providerCallbackHost: 'webhook.transconnect.ug' // Your domain
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': MTN_CONFIG.environment,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API User created successfully');
    console.log('📋 User ID:', referenceId);
    
    // Step 2: Create API Key for the user
    console.log('\n🔑 Step 2: Creating API Key...');
    
    const createKeyResponse = await axios.post(
      `${MTN_CONFIG.baseUrl}/v1_0/apiuser/${referenceId}/apikey`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
          'X-Target-Environment': MTN_CONFIG.environment
        }
      }
    );
    
    const apiKey = createKeyResponse.data.apiKey;
    console.log('✅ API Key created successfully');
    console.log('🔐 API Key:', apiKey);
    
    // Step 3: Test getting access token
    console.log('\n🎫 Step 3: Testing Access Token...');
    
    const credentials = Buffer.from(`${referenceId}:${apiKey}`).toString('base64');
    
    const tokenResponse = await axios.post(
      `${MTN_CONFIG.baseUrl}/collection/token/`,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': MTN_CONFIG.subscriptionKey,
          'X-Target-Environment': MTN_CONFIG.environment,
          'Authorization': `Basic ${credentials}`
        }
      }
    );
    
    console.log('✅ Access token obtained successfully');
    console.log('🎟️ Token expires in:', tokenResponse.data.expires_in, 'seconds');
    
    // Display configuration summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MTN MOBILE MONEY CONFIGURATION SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\n📋 Environment Variables to set in Render:');
    console.log(`MTN_SUBSCRIPTION_KEY=${MTN_CONFIG.subscriptionKey}`);
    console.log(`MTN_BASE_URL=${MTN_CONFIG.baseUrl}`);
    console.log(`MTN_USER_ID=${referenceId}`);
    console.log(`MTN_API_KEY=${apiKey}`);
    console.log(`MTN_ENVIRONMENT=sandbox`);
    console.log(`CALLBACK_HOST=transconnect-app-44ie.onrender.com`);
    console.log('\n✅ Copy these variables to your Render environment settings');
    
  } catch (error) {
    console.error('\n❌ MTN Configuration Error:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
    }
    
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Verify your subscription key is correct');
    console.log('2. Ensure you have access to the MTN sandbox');
    console.log('3. Check that your IP is whitelisted (if required)');
  }
}

// Run the test
testMTNConfiguration();