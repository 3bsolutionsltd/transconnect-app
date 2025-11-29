const axios = require('axios');

async function debugAgentRoutes() {
  console.log('🔍 Debugging agent routes...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  const testRoutes = [
    '/api/health',
    '/api/auth/login',
    '/api/agents',
    '/api/agents/login',
    '/api/agents/register',
  ];
  
  for (const route of testRoutes) {
    try {
      const response = await axios.get(`${baseUrl}${route}`);
      console.log(`✅ GET ${route}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';
      const data = error.response?.data || error.message;
      console.log(`❌ GET ${route}: ${status} - ${JSON.stringify(data)}`);
    }
  }
  
  // Test POST to agent login (this is what frontend is trying)
  console.log('\n🧪 Testing POST to /api/agents/login...');
  try {
    const response = await axios.post(`${baseUrl}/api/agents/login`, {
      phone: '+256700000000'  // dummy data
    });
    console.log(`✅ POST /api/agents/login: ${response.status}`);
  } catch (error) {
    const status = error.response?.status || 'NO_RESPONSE';
    const data = error.response?.data || error.message;
    console.log(`❌ POST /api/agents/login: ${status} - ${JSON.stringify(data)}`);
  }
}

debugAgentRoutes();