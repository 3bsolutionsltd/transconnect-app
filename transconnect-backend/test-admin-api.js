// Test API connectivity for admin dashboard
async function testAdminAPI() {
  const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';
  
  console.log('🔍 Testing Admin API connectivity...');
  console.log('API Base URL:', API_BASE_URL);
  
  // Test 1: Basic connectivity
  try {
    console.log('\n1️⃣ Testing basic connectivity...');
    const response = await fetch(API_BASE_URL + '/health');
    console.log('Health check status:', response.status);
    if (response.ok) {
      const data = await response.text();
      console.log('Health check response:', data);
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  
  // Test 2: Users endpoint without auth
  try {
    console.log('\n2️⃣ Testing /users endpoint without auth...');
    const response = await fetch(API_BASE_URL + '/users');
    console.log('Users endpoint status:', response.status);
    const data = await response.json();
    console.log('Users endpoint response:', data);
  } catch (error) {
    console.log('❌ Users endpoint failed:', error.message);
  }
  
  // Test 3: Check what endpoints are available
  try {
    console.log('\n3️⃣ Testing available endpoints...');
    const endpoints = ['/auth/login', '/auth/register', '/routes', '/bookings'];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(API_BASE_URL + endpoint);
        console.log(`${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Endpoint testing failed:', error.message);
  }
  
  // Test 5: Try to login with admin credentials
  try {
    console.log('\n5️⃣ Testing admin login...');
    const loginResponse = await fetch(API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@transconnect.ug',
        password: 'admin123'
      })
    });
    
    console.log('Admin login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Admin login response:', loginData);
    
    if (loginData.token) {
      // Test authenticated users endpoint
      console.log('\n6️⃣ Testing users endpoint with admin token...');
      const usersResponse = await fetch(API_BASE_URL + '/users', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Authenticated users status:', usersResponse.status);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data:', Array.isArray(usersData) ? `Array with ${usersData.length} users` : usersData);
      } else {
        const error = await usersResponse.json();
        console.log('Users error:', error);
      }
    }
  } catch (error) {
    console.log('❌ Admin login test failed:', error.message);
  }
  
  // Test 4: Check if the backend is running locally
  try {
    console.log('\n4️⃣ Testing local backend...');
    const response = await fetch('http://localhost:5000/api/users');
    console.log('Local backend status:', response.status);
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Local backend is running (auth required)');
    }
  } catch (error) {
    console.log('❌ Local backend not accessible:', error.message);
  }
}

testAdminAPI().catch(console.error);