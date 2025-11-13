// Test admin login flow end-to-end
async function testAdminLoginFlow() {
  const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';
  
  console.log('🔐 Testing Admin Login Flow...');
  console.log('API Base URL:', API_BASE_URL);
  
  // Step 1: Test admin login
  console.log('\n1️⃣ Testing admin login...');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@transconnect.ug',
        password: 'admin123'
      }),
    });

    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('Login error:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User role:', loginData.user.role);
    console.log('Token received:', loginData.token ? 'Yes' : 'No');
    
    // Step 2: Test users endpoint with token
    console.log('\n2️⃣ Testing /users endpoint...');
    const usersResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Users endpoint status:', usersResponse.status);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users fetch successful');
      console.log('Users count:', Array.isArray(usersData) ? usersData.length : 'Not an array');
      console.log('Sample user:', Array.isArray(usersData) && usersData[0] ? {
        id: usersData[0].id,
        name: `${usersData[0].firstName} ${usersData[0].lastName}`,
        email: usersData[0].email,
        role: usersData[0].role
      } : 'No users');
    } else {
      const errorData = await usersResponse.json();
      console.log('❌ Users fetch failed:', errorData);
    }
    
    // Step 3: Test token validation
    console.log('\n3️⃣ Testing token validation...');
    const tokenParts = loginData.token.split('.');
    console.log('Token parts:', tokenParts.length);
    
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          exp: new Date(payload.exp * 1000).toISOString()
        });
      } catch (e) {
        console.log('❌ Failed to decode token:', e.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

testAdminLoginFlow().catch(console.error);