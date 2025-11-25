/**
 * Test Agent Operator Management System
 */

const apiUrl = 'http://localhost:5000';

async function testAgentOperatorSystem() {
  console.log('🧪 Testing Agent Operator Management System...\n');

  try {
    // 1. Get Stephen's agent info first
    console.log('1. Getting Stephen\'s agent info...');
    const agentResponse = await fetch(`${apiUrl}/api/agents/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Stephen Omwony Test',
        phone: '256770123999', // Different phone for testing
        email: 'stephen.test@example.com'
      })
    });

    if (!agentResponse.ok) {
      console.log('Agent might already exist, continuing...');
    }

    // For testing, we'll use a mock agent ID
    const testAgentId = 'test-agent-id-123';

    // 2. Test operator registration
    console.log('\n2. Testing operator registration...');
    const operatorData = {
      companyName: 'Test Bus Company Ltd',
      license: 'TBC-001-TEST',
      firstName: 'John',
      lastName: 'Operator',
      email: 'john.operator@testcompany.com',
      phone: '256701234567',
      password: 'password123'
    };

    const registerResponse = await fetch(`${apiUrl}/api/agents/${testAgentId}/operators`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      },
      body: JSON.stringify(operatorData)
    });

    console.log('Operator Registration Response:', registerResponse.status);
    if (registerResponse.ok) {
      const registerResult = await registerResponse.json();
      console.log('✅ Operator registered:', registerResult.operator?.companyName);
    } else {
      const error = await registerResponse.text();
      console.log('❌ Registration failed:', error);
    }

    // 3. Test getting agent operators
    console.log('\n3. Testing get agent operators...');
    const getOperatorsResponse = await fetch(`${apiUrl}/api/agents/${testAgentId}/operators`, {
      headers: { 
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('Get Operators Response:', getOperatorsResponse.status);
    if (getOperatorsResponse.ok) {
      const operatorsResult = await getOperatorsResponse.json();
      console.log('✅ Operators found:', operatorsResult.count);
      console.log('Operators:', operatorsResult.operators?.map(op => op.companyName));
    } else {
      const error = await getOperatorsResponse.text();
      console.log('❌ Get operators failed:', error);
    }

    // 4. Test dashboard
    console.log('\n4. Testing operator dashboard...');
    const dashboardResponse = await fetch(`${apiUrl}/api/agents/${testAgentId}/operators/dashboard`, {
      headers: { 
        'Authorization': 'Bearer test-token'
      }
    });

    console.log('Dashboard Response:', getOperatorsResponse.status);
    if (dashboardResponse.ok) {
      const dashboardResult = await dashboardResponse.json();
      console.log('✅ Dashboard data:', {
        totalOperators: dashboardResult.dashboard?.summary?.totalOperators,
        activeOperators: dashboardResult.dashboard?.summary?.activeOperators,
        totalRevenue: dashboardResult.dashboard?.summary?.totalRevenue
      });
    } else {
      const error = await dashboardResponse.text();
      console.log('❌ Dashboard failed:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test the backend health first
async function testBackendHealth() {
  try {
    console.log('🏥 Testing backend health...');
    const response = await fetch(`${apiUrl}/health`);
    if (response.ok) {
      const health = await response.json();
      console.log('✅ Backend is healthy:', health.message);
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not running:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const isHealthy = await testBackendHealth();
  if (isHealthy) {
    console.log('\n' + '='.repeat(50));
    await testAgentOperatorSystem();
  }
}

runTests();