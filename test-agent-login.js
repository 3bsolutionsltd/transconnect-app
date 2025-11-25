// Test Agent Login System
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAgentLogin() {
  console.log('🔍 Testing TransConnect Agent Login System');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Backend Health
    console.log('\n1. Testing Backend Health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend:', healthResponse.data.message);
    
    // Test 2: Agent Login (should create test agent first)
    console.log('\n2. Testing Agent Registration (for test data)...');
    try {
      const regResponse = await axios.post(`${BASE_URL}/api/agents/register`, {
        name: 'Test Agent',
        phone: '256701234567',
        email: 'testagent@test.com'
      });
      console.log('✅ Test agent created for login testing');
    } catch (regError) {
      if (regError.response?.status === 400) {
        console.log('✅ Test agent already exists');
      } else {
        console.log('❌ Agent registration error:', regError.response?.data?.error || regError.message);
      }
    }
    
    // Test 3: Agent Login Endpoint
    console.log('\n3. Testing Agent Login Endpoint...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/api/agents/login`, {
        phone: '256701234567'
      });
      console.log('✅ Agent Login:', loginResponse.data.message);
      console.log('   Next Step:', loginResponse.data.next_step);
      
      // Test 4: Login Verification (with dummy OTP)
      console.log('\n4. Testing Agent Login Verification...');
      try {
        const verifyResponse = await axios.post(`${BASE_URL}/api/agents/login/verify`, {
          phone: '256701234567',
          otp: '123456' // This will fail but should show the endpoint exists
        });
        console.log('✅ Login Verification: Working');
      } catch (verifyError) {
        if (verifyError.response?.status === 400 && verifyError.response?.data?.error.includes('Invalid')) {
          console.log('✅ Login Verification Endpoint: Working (Invalid OTP expected)');
        } else {
          console.log('❌ Login Verification Error:', verifyError.response?.data?.error || verifyError.message);
        }
      }
      
    } catch (loginError) {
      console.log('❌ Agent Login Error:', loginError.response?.data?.error || loginError.message);
      console.log('   Status:', loginError.response?.status);
      console.log('   URL:', loginError.config?.url);
    }
    
    // Test 5: Frontend URLs
    console.log('\n5. Testing Frontend URLs...');
    try {
      await axios.get('http://localhost:3002', { timeout: 3000 });
      console.log('✅ Agent Frontend: Running');
    } catch {
      console.log('❌ Agent Frontend: Not responding');
    }
    
    try {
      await axios.get('http://localhost:3003', { timeout: 3000 });
      console.log('✅ Admin Panel: Running');
    } catch {
      console.log('❌ Admin Panel: Not responding');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🌐 Test URLs:');
  console.log('   • Backend API:     http://localhost:5000');
  console.log('   • Agent Frontend:  http://localhost:3002');
  console.log('   • Agent Login:     http://localhost:3002/agents/login');
  console.log('   • Admin Panel:     http://localhost:3003');
  console.log('\n📝 Test Phone: 256701234567');
  console.log('💡 If login endpoints are 404, restart the backend externally');
}

testAgentLogin();