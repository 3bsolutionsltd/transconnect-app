// Test script for production API endpoints
const https = require('https');

const API_BASE = 'https://transconnect-backend.onrender.com';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAPIs() {
  console.log('🔄 Testing Production APIs...\n');
  
  try {
    // Test basic health/routes endpoint
    console.log('1️⃣ Testing Routes API...');
    const routesResult = await makeRequest('/api/routes');
    console.log(`   Status: ${routesResult.status}`);
    console.log(`   Routes Count: ${Array.isArray(routesResult.data) ? routesResult.data.length : 'Error'}`);
    
    // Test operators API
    console.log('\n2️⃣ Testing Operators API...');
    const operatorsResult = await makeRequest('/api/operators');
    console.log(`   Status: ${operatorsResult.status}`);
    console.log(`   Operators Count: ${Array.isArray(operatorsResult.data) ? operatorsResult.data.length : 'Error'}`);
    
    // Test buses API
    console.log('\n3️⃣ Testing Buses API...');
    const busesResult = await makeRequest('/api/buses');
    console.log(`   Status: ${busesResult.status}`);
    console.log(`   Buses Count: ${Array.isArray(busesResult.data) ? busesResult.data.length : 'Error'}`);
    
    // Test users API
    console.log('\n4️⃣ Testing Users API...');
    const usersResult = await makeRequest('/api/users');
    console.log(`   Status: ${usersResult.status}`);
    console.log(`   Users Count: ${Array.isArray(usersResult.data) ? usersResult.data.length : 'Error'}`);
    
    console.log('\n✅ API Testing Complete!');
    
    // Show sample data if available
    if (Array.isArray(routesResult.data) && routesResult.data.length > 0) {
      console.log('\n📋 Sample Route Data:');
      console.log(JSON.stringify(routesResult.data[0], null, 2));
    }
    
    if (Array.isArray(operatorsResult.data) && operatorsResult.data.length > 0) {
      console.log('\n📋 Sample Operator Data:');
      console.log(JSON.stringify(operatorsResult.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testAPIs();