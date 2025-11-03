// Simple test script for TransConnect API
// Using Node.js built-in fetch (Node 18+)

const API_BASE = 'http://localhost:5000';

// Test health endpoint
async function testHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

// Test user registration
async function testRegister() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@transconnect.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+256701234567'
      })
    });
    
    const data = await response.json();
    console.log('✅ Register test:', data);
    return data.token;
  } catch (error) {
    console.log('❌ Register test failed:', error.message);
  }
}

// Test user login
async function testLogin() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@transconnect.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('✅ Login test:', data);
  } catch (error) {
    console.log('❌ Login test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing TransConnect API...\n');
  
  await testHealth();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testRegister();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testLogin();
  
  console.log('\n✨ API tests completed!');
}

runTests();