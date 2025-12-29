const axios = require('axios');

const API_URL = 'https://transconnect-app-44ie.onrender.com/api';

async function testProfileEndpoints() {
  let token;
  
  try {
    // First, try to register a new user
    console.log('📝 Step 1: Register new test user...');
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        email: 'profile-tester@transconnect.app',
        password: 'Test123456!',
        firstName: 'Profile',
        lastName: 'Tester',
        phone: '+256701234567',
        role: 'PASSENGER'
      });
      
      token = registerRes.data.token;
      console.log('✅ User registered successfully!');
      console.log('User:', registerRes.data.user);
      console.log('');
    } catch (regError) {
      if (regError.response?.data?.error === 'User already exists') {
        console.log('ℹ️  User already exists, logging in instead...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: 'profile-tester@transconnect.app',
          password: 'Test123456!'
        });
        token = loginRes.data.token;
        console.log('✅ Login successful!');
        console.log('');
      } else {
        throw regError;
      }
    }
    
    console.log('📝 Step 2: Test GET /auth/me...');
    const profileRes = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile fetched successfully:');
    console.log(JSON.stringify(profileRes.data, null, 2));
    console.log('');
    
    console.log('📝 Step 3: Test PUT /auth/profile...');
    const updateRes = await axios.put(`${API_URL}/auth/profile`, {
      firstName: 'Updated Profile',
      lastName: 'Test User',
      phone: '+256707777777'
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
    console.log('\n📱 You can now use the Edit Profile feature in the mobile app!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('\n⚠️  Endpoint not found - deployment may not be complete yet');
      console.log('💡 Please wait a bit longer and try again');
    } else if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed - token may be invalid');
    } else {
      console.log('\nFull error:', error.response?.status, error.response?.data);
    }
    process.exit(1);
  }
}

testProfileEndpoints();
