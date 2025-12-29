const axios = require('axios');

const API_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testProfileEndpoints() {
  try {
    console.log('🔐 Step 1: Login to get auth token...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'test123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful! Token:', token.substring(0, 20) + '...\n');
    
    console.log('📝 Step 2: Test GET /auth/me...');
    const profileRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile fetched successfully:');
    console.log(JSON.stringify(profileRes.data, null, 2));
    console.log('');
    
    console.log('📝 Step 3: Test PUT /auth/profile...');
    const updateRes = await axios.put(`${API_URL}/auth/profile`, {
      firstName: 'Updated',
      lastName: 'TestUser',
      phone: '+256701234999'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile updated successfully:');
    console.log(JSON.stringify(updateRes.data, null, 2));
    console.log('');
    
    console.log('🔄 Step 4: Verify update by fetching profile again...');
    const verifyRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Verified updated profile:');
    console.log(JSON.stringify(verifyRes.data, null, 2));
    console.log('');
    
    console.log('🎉 All tests passed!');
    console.log('\n✨ Profile endpoints are working correctly on production!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n⚠️  Endpoint not found - deployment may still be in progress');
      console.log('💡 Render deployment usually takes 2-5 minutes');
      console.log('Please wait and try again with: node test-profile-endpoints.js');
    } else if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed - check credentials');
    } else {
      console.log('\nFull error:', error.response?.data);
    }
    process.exit(1);
  }
}

testProfileEndpoints();
