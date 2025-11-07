const axios = require('axios');

async function testRoutesAPI() {
  console.log('Testing Routes API endpoints...');
  
  // Test both local and production API URLs
  const testUrls = [
    'http://localhost:5000',
    'http://localhost:5000/api/routes',
    'https://transconnect-app-44ie.onrender.com/api/routes'
  ];
  
  for (const baseUrl of testUrls) {
    console.log(`\nTesting: ${baseUrl}`);
    try {
      const response = await axios.get(baseUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Status:', response.status);
      console.log('✅ Response type:', typeof response.data);
      
      if (Array.isArray(response.data)) {
        console.log('✅ Routes found:', response.data.length);
        if (response.data.length > 0) {
          const route = response.data[0];
          console.log('📋 Sample route:', {
            id: route.id,
            origin: route.origin,
            destination: route.destination,
            price: route.price
          });
        }
      } else if (response.data && typeof response.data === 'object') {
        console.log('✅ Response keys:', Object.keys(response.data));
      } else {
        console.log('✅ Response:', String(response.data).substring(0, 100));
      }
      
    } catch (error) {
      console.log('❌ Error:', error.response?.status || error.message);
    }
  }
}

testRoutesAPI();