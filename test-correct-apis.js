// Test the correct production API endpoints
const https = require('https');

const API_BASE = 'https://transconnect-app-44ie.onrender.com/api';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}${path}`;
    const req = https.request(url, (res) => {
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
    req.end();
  });
}

async function testCorrectAPIs() {
  console.log('🔄 Testing CORRECT Production APIs...\n');
  
  try {
    console.log('1️⃣ Testing Routes API...');
    const routesResult = await makeRequest('/routes');
    console.log(`   Status: ${routesResult.status}`);
    if (Array.isArray(routesResult.data)) {
      console.log(`   Routes Count: ${routesResult.data.length}`);
      if (routesResult.data.length > 0) {
        console.log(`   Sample Route: ${routesResult.data[0].origin} → ${routesResult.data[0].destination}`);
        if (routesResult.data[0].via) {
          console.log(`   Via: ${routesResult.data[0].via}`);
        }
      }
    } else {
      console.log(`   Response: ${JSON.stringify(routesResult.data)}`);
    }
    
    console.log('\n2️⃣ Testing Operators API...');
    const operatorsResult = await makeRequest('/operators');
    console.log(`   Status: ${operatorsResult.status}`);
    if (Array.isArray(operatorsResult.data)) {
      console.log(`   Operators Count: ${operatorsResult.data.length}`);
      if (operatorsResult.data.length > 0) {
        console.log(`   Sample Operator: ${operatorsResult.data[0].companyName}`);
      }
    } else {
      console.log(`   Response: ${JSON.stringify(operatorsResult.data)}`);
    }
    
    console.log('\n3️⃣ Testing Buses API...');
    const busesResult = await makeRequest('/buses');
    console.log(`   Status: ${busesResult.status}`);
    if (Array.isArray(busesResult.data)) {
      console.log(`   Buses Count: ${busesResult.data.length}`);
      if (busesResult.data.length > 0) {
        console.log(`   Sample Bus: ${busesResult.data[0].plateNumber} (${busesResult.data[0].model})`);
      }
    } else {
      console.log(`   Response: ${JSON.stringify(busesResult.data)}`);
    }
    
    console.log('\n✅ API Testing Complete!');
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

testCorrectAPIs();