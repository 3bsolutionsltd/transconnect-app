// Test health endpoints
const https = require('https');

function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.request(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ 
          status: res.statusCode, 
          body: body,
          url: url
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({ 
        status: 'ERROR', 
        body: error.message,
        url: url
      });
    });
    
    req.end();
  });
}

async function testHealthEndpoints() {
  console.log('🔄 Testing Health Endpoints...\n');
  
  const endpoints = [
    'https://transconnect-backend.onrender.com/health',
    'https://transconnect-backend.onrender.com/api/health',
    'https://transconnect-backend.onrender.com',
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`📍 ${endpoint}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Response: ${result.body.substring(0, 200)}${result.body.length > 200 ? '...' : ''}`);
    console.log('');
  }
}

testHealthEndpoints();