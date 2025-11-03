const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoint...\n');

  try {
    // Test user registration
    const registrationData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      phone: '+256700123456',
      password: 'testpass123'
    };

    console.log('Attempting registration with:', {
      ...registrationData,
      password: '***hidden***'
    });

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registrationData);
    
    console.log('✅ Registration successful!');
    console.log('Response:', registerResponse.data);

    // Test login with the new user
    console.log('\n🔐 Testing login with new user...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: registrationData.email,
      password: registrationData.password
    });

    console.log('✅ Login successful!');
    console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');

  } catch (error) {
    console.error('❌ Registration/Login Failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error || error.message);
    console.error('Full response:', error.response?.data);
  }
}

testRegistration();