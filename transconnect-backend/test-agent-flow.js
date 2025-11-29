const axios = require('axios');

async function testAgentFlow() {
  try {
    console.log('Testing agent authentication and operator creation...\n');

    // First, let's try to get all agents to see what agent IDs exist
    console.log('1. Checking available agents...');
    try {
      // This might need admin token, but let's try
      const agentsResponse = await axios.get('http://localhost:5000/api/agents');
      console.log('Available agents:', agentsResponse.data);
    } catch (error) {
      console.log('Could not fetch agents (might need admin auth):', error.response?.data);
    }

    // Test agent login (you'll need to provide actual agent credentials)
    console.log('\n2. Testing agent login...');
    console.log('Note: You need to provide actual agent credentials for this test');
    
    // Uncomment and modify these lines with actual agent credentials:
    /*
    const loginResponse = await axios.post('http://localhost:5000/api/agents/login', {
      phone: '+256700000000', // Replace with actual agent phone
      // You might need OTP verification step here
    });
    
    console.log('Agent login response:', loginResponse.data);
    
    if (loginResponse.data.token) {
      const agentToken = loginResponse.data.token;
      const agentId = loginResponse.data.agent.id;
      
      console.log('\n3. Testing operator creation...');
      const operatorData = {
        companyName: 'Test Bus Company',
        license: 'TEST-LIC-123',
        firstName: 'Test',
        lastName: 'Operator',
        email: 'test@operator.com',
        phone: '+256701234567',
        password: 'password123'
      };
      
      const createResponse = await axios.post(
        `http://localhost:5000/api/agents/${agentId}/operators`,
        operatorData,
        {
          headers: {
            'Authorization': `Bearer ${agentToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Operator creation successful:', createResponse.data);
    }
    */
    
    console.log('\nTo test fully, uncomment the lines above and provide:');
    console.log('- Valid agent phone number');
    console.log('- Complete the OTP verification flow');
    console.log('- Use the returned token to create operators');
    
  } catch (error) {
    console.error('Test error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

testAgentFlow();