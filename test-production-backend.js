const axios = require('axios');

async function testProductionAPI() {
  const baseURL = 'https://transconnect-app-44ie.onrender.com';
  
  console.log('Testing Production Backend...');
  
  // Test health endpoint
  try {
    console.log('\n1. Testing Health Check...');
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Health Status:', health.status);
    console.log('✅ Health Data:', health.data);
  } catch (err) {
    console.log('❌ Health Error:', err.response?.status || err.message);
  }

  // Test API base
  try {
    console.log('\n2. Testing API Base...');
    const api = await axios.get(`${baseURL}/api`);
    console.log('✅ API Status:', api.status);
    console.log('✅ API Data:', api.data);
  } catch (err) {
    console.log('❌ API Base Error:', err.response?.status || err.message);
  }

  // Test routes with detailed error
  try {
    console.log('\n3. Testing Routes Endpoint...');
    const routes = await axios.get(`${baseURL}/api/routes`);
    console.log('✅ Routes Status:', routes.status);
    console.log('✅ Routes Count:', routes.data?.length || 'No array');
  } catch (err) {
    console.log('❌ Routes Error Status:', err.response?.status);
    console.log('❌ Routes Error Message:', err.response?.data?.error || err.message);
    console.log('❌ Full Error Details:', err.response?.data || 'No response data');
  }
}

testProductionAPI();