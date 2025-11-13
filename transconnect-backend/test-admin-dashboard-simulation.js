// Simulate admin dashboard API calls
async function simulateAdminDashboard() {
  const API_BASE_URL = 'https://transconnect-app-44ie.onrender.com/api';
  
  console.log('🖥️ Simulating Admin Dashboard API Calls...');
  
  // Step 1: Simulate login (what the admin dashboard does)
  console.log('\n1️⃣ Simulating admin login...');
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

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Step 2: Store token (simulate localStorage)
    const adminToken = loginData.token;
    console.log('Token stored:', adminToken ? 'Yes' : 'No');
    
    // Step 3: Simulate UserManagement component fetchUsers call
    console.log('\n2️⃣ Simulating UserManagement fetchUsers...');
    
    const getAuthHeaders = () => {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      };
    };
    
    const usersResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    console.log('Users API status:', usersResponse.status);
    console.log('Users API headers sent:', getAuthHeaders());
    
    if (!usersResponse.ok) {
      const errorData = await usersResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.log('❌ Users API error:', errorData);
    } else {
      const usersData = await usersResponse.json();
      console.log('✅ Users API success');
      console.log('Response type:', Array.isArray(usersData) ? 'Array' : typeof usersData);
      console.log('Users count:', Array.isArray(usersData) ? usersData.length : 'N/A');
      
      // Test what the UserManagement component expects
      const processedData = Array.isArray(usersData) ? usersData : (usersData.data || usersData);
      console.log('Processed data type:', Array.isArray(processedData) ? 'Array' : typeof processedData);
      console.log('Processed users count:', Array.isArray(processedData) ? processedData.length : 'N/A');
    }
    
    
  } catch (error) {
    console.log('❌ Simulation failed:', error.message);
  }
}

simulateAdminDashboard().catch(console.error);