const API_BASE = 'https://transconnect-backend-api.onrender.com/api/agents';

async function testProfileEndpoint() {
  console.log('Testing Profile Endpoint...');
  
  try {
    // Test profile update
    const testProfile = {
      agentId: 'test-agent-id',
      momoNumber: '+256700000000',
      bankName: 'Stanbic Bank',
      bankAccount: '1234567890'
    };

    console.log('1. Testing PUT /profile endpoint...');
    const updateResponse = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProfile)
    });

    console.log(`Status: ${updateResponse.status}`);
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('✅ Profile update successful:', result);
    } else {
      const error = await updateResponse.text();
      console.log('❌ Profile update failed:', error);
    }

    // Test profile get (if we have an agent ID)
    console.log('\n2. Testing GET /profile/:agentId endpoint...');
    const getResponse = await fetch(`${API_BASE}/profile/test-agent-id`);
    
    console.log(`Status: ${getResponse.status}`);
    
    if (getResponse.ok) {
      const result = await getResponse.json();
      console.log('✅ Profile get successful:', result);
    } else {
      const error = await getResponse.text();
      console.log('❌ Profile get failed:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test health endpoint first
async function testHealth() {
  try {
    console.log('Testing backend health...');
    const response = await fetch('https://transconnect-backend-api.onrender.com/health');
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Backend is healthy:', health);
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Profile Endpoint Test ===\n');
  
  const isHealthy = await testHealth();
  
  if (isHealthy) {
    console.log('\n=== Testing Profile Endpoints ===\n');
    await testProfileEndpoint();
  } else {
    console.log('⏳ Backend might still be deploying. Try again in a few minutes.');
  }
}

runTests();