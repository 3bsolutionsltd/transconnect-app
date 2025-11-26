const API_BASE = 'http://localhost:5000/api/agents';

async function testProfileEndpoint() {
  console.log('Testing Profile Endpoint (LOCAL)...');
  
  try {
    // First, let's get a real agent ID from the database
    console.log('1. Getting available agents...');
    
    // Try to register a test agent or use existing one
    const testAgent = {
      name: 'Test Agent Profile',
      phone: '+256700000999',
      referralCode: 'TEST123'
    };

    console.log('2. Registering test agent (or finding existing)...');
    const registerResponse = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAgent)
    });

    let agentId;
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ Agent registered:', registerResult);
      agentId = registerResult.agent?.id;
    } else {
      // Agent might already exist, let's use a dummy ID for now
      console.log('⚠️ Agent registration skipped (might exist)');
      agentId = 'test-agent-id';
    }

    if (!agentId) {
      console.log('❌ No agent ID available for testing');
      return;
    }

    // Test profile update
    const testProfile = {
      agentId: agentId,
      momoNumber: '+256700000000',
      bankName: 'Stanbic Bank',
      bankAccount: '1234567890'
    };

    console.log('3. Testing PUT /profile endpoint...');
    const updateResponse = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProfile)
    });

    console.log(`PUT Status: ${updateResponse.status}`);
    
    if (updateResponse.ok) {
      const result = await updateResponse.json();
      console.log('✅ Profile update successful:', JSON.stringify(result, null, 2));
    } else {
      const error = await updateResponse.text();
      console.log('❌ Profile update failed:', error);
    }

    // Test profile get
    console.log('\n4. Testing GET /profile/:agentId endpoint...');
    const getResponse = await fetch(`${API_BASE}/profile/${agentId}`);
    
    console.log(`GET Status: ${getResponse.status}`);
    
    if (getResponse.ok) {
      const result = await getResponse.json();
      console.log('✅ Profile get successful:', JSON.stringify(result, null, 2));
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
    console.log('Testing local backend health...');
    const response = await fetch('http://localhost:5000/health');
    
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Local backend is healthy:', health);
      return true;
    } else {
      console.log('❌ Local backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Local backend is not accessible:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== LOCAL Profile Endpoint Test ===\n');
  
  const isHealthy = await testHealth();
  
  if (isHealthy) {
    console.log('\n=== Testing Profile Endpoints (LOCAL) ===\n');
    await testProfileEndpoint();
  } else {
    console.log('❌ Local backend is not running. Start it with: cd transconnect-backend && npm run dev');
  }
}

runTests();