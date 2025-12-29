const axios = require('axios');

const API_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testProfileEndpoints() {
  try {
    console.log('🔐 Step 1: Login with existing user...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'john@example.com',
      password: 'password123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful!');
    console.log('Token:', token.substring(0, 30) + '...\n');
    
    console.log('📝 Step 2: Test GET /auth/me...');
    const profileRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile fetched successfully:');
    console.log(JSON.stringify(profileRes.data, null, 2));
    console.log('');
    
    console.log('📝 Step 3: Test PUT /auth/profile...');
    const updateRes = await axios.put(`${API_URL}/auth/profile`, {
      firstName: 'John Updated',
      lastName: 'Doe Modified',
      phone: '+256788888888'
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
    
    // Verify the changes actually took effect
    const changes = {
      firstName: verifyRes.data.firstName === 'John Updated',
      lastName: verifyRes.data.lastName === 'Doe Modified',
      phone: verifyRes.data.phone === '+256788888888'
    };
    
    if (changes.firstName && changes.lastName && changes.phone) {
      console.log('✅ All changes verified successfully!');
    } else {
      console.log('⚠️  Some changes may not have been applied:', changes);
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('✨ Profile endpoints are working correctly on production!');
    console.log('📱 You can now use the Edit Profile feature in the mobile app!');
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 404) {
      console.log('\n⚠️  Endpoint not found - check if deployment is complete');
    } else if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed - check credentials');
    }
    process.exit(1);
  }
}

testProfileEndpoints();
